import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { createUser, ORIGIN, prisma, sharp } from './helpers'
import { createApp } from '../../server/src/app'
import { MARATHON_RULES } from '../../server/src/lib/game'
import { SWITCH_PREVIEW_MS } from '../../server/src/services/runRules'

const app = createApp()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('health', () => {
  it('reports what the web app may offer', async () => {
    const response = await request(app).get('/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({ value: { status: 'ok', google: false, gemini: false }, error: null })
  })

  it('answers unknown routes in the envelope', async () => {
    const response = await request(app).get('/nope')
    expect(response.status).toBe(404)
    expect(response.body.error).toEqual({ code: 404, message: 'Not found' })
  })
})

describe('identity', () => {
  it('treats a guest as null, not an error', async () => {
    const response = await request(app).get('/identity/me')
    expect(response.status).toBe(200)
    expect(response.body.value).toBeNull()
  })

  it('recognises a session cookie, and stops when the token version moves on', async () => {
    const { user, cookie } = await createUser('Session')
    expect((await request(app).get('/identity/me').set('Cookie', cookie)).body.value.displayName).toBe('Session')

    await prisma.user.update({ where: { id: user.id }, data: { tokenVersion: { increment: 1 } } })
    expect((await request(app).get('/identity/me').set('Cookie', cookie)).body.value).toBeNull()
  })
})

describe('questions', () => {
  it('serves a whole Classic game from the English bank', async () => {
    const response = await request(app)
      .post('/questions/batch')
      .set('Origin', ORIGIN)
      .send({ locale: 'en', counts: { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3 } })
    expect(response.status).toBe(200)
    expect(response.body.value).toHaveLength(15)
    for (const question of response.body.value) {
      expect(question.options).toHaveLength(4)
      expect(question.correctIndex).toBeGreaterThanOrEqual(0)
      expect(question.fallback).toBe(false)
    }
  })

  it('falls back to English, flagged, when a locale has no pool and Gemini is off', async () => {
    const response = await request(app).post('/questions/batch').set('Origin', ORIGIN).send({ locale: 'hy', counts: { 1: 2 } })
    expect(response.status).toBe(200)
    expect(response.body.value).toHaveLength(2)
    expect(response.body.value.every((question: { fallback: boolean }) => question.fallback)).toBe(true)
  })

  it('honours excluded ids before repeating', async () => {
    const first = await request(app).post('/questions/batch').set('Origin', ORIGIN).send({ locale: 'en', counts: { 1: 5 } })
    const excludeIds = first.body.value.map(({ id }: { id: string }) => id)
    const second = await request(app).post('/questions/batch').set('Origin', ORIGIN).send({ locale: 'en', counts: { 1: 5 }, excludeIds })
    const overlap = second.body.value.filter(({ id }: { id: string }) => excludeIds.includes(id))
    expect(overlap).toHaveLength(0)
  })

  it('validates the request', async () => {
    const bad = [
      { locale: 'xx', counts: { 1: 1 } },
      { locale: 'en', counts: {} },
      { locale: 'en', counts: { 1: 11 } },
    ]
    for (const body of bad) {
      expect((await request(app).post('/questions/batch').set('Origin', ORIGIN).send(body)).status).toBe(400)
    }
  })

  it('refuses a cross-origin write', async () => {
    const response = await request(app).post('/questions/batch').set('Origin', 'https://evil.example').send({ locale: 'en', counts: { 1: 1 } })
    expect(response.status).toBe(403)
  })

  it('builds an offline pack', async () => {
    const response = await request(app).get('/questions/packs/en')
    expect(response.status).toBe(200)
    expect(response.body.value.questions.length).toBeGreaterThan(100)
    expect(response.body.value.version).toMatch(/^\d+-\d+$/)
  })
})

describe('phone a friend', () => {
  it('names an option still on the board, with template words when the AI is off', async () => {
    const response = await request(app)
      .post('/lifelines/phone-a-friend')
      .set('Origin', ORIGIN)
      .send({ locale: 'en', question: 'Q?', options: ['a', 'b', 'c', 'd'], correctIndex: 2, removed: [0, 1], level: 1 })
    expect(response.status).toBe(200)
    expect([2, 3]).toContain(response.body.value.suggestedIndex)
    expect(response.body.value.message).toBeNull()
  })
})

describe('ranked runs', () => {
  it('lets a guest play, tied to its own cookie and kept off the leaderboard', async () => {
    const guest = request.agent(app)
    const start = await guest.post('/runs').set('Origin', ORIGIN).send({ mode: 'marathon', locale: 'en' })
    expect(start.status).toBe(201)
    const run = start.body.value
    expect((await guest.get(`/runs/${run.id}`)).status).toBe(200)
    // Another browser (no guest cookie) cannot see or play it.
    expect((await request(app).get(`/runs/${run.id}`)).status).toBe(404)

    const row = await prisma.run.findUniqueOrThrow({ where: { id: run.id } })
    expect(row.userId).toBeNull()
    const question = await prisma.question.findUniqueOrThrow({ where: { id: row.currentQuestionId! } })
    const shown = row.currentOrder.indexOf(question.correctIndex)
    const answer = await guest.post(`/runs/${run.id}/answer`).set('Origin', ORIGIN).send({ questionId: run.question.id, index: shown })
    expect(answer.body.value.run.score).toBe(1)
    // Finished with a score, yet still not on the board: there is no account to show.
    await prisma.run.update({ where: { id: run.id }, data: { status: 'finished', finishedAt: new Date() } })

    const board = await request(app).get('/leaderboards').query({ mode: 'marathon' })
    expect(board.body.value.entries.every((entry: { userId: string | null }) => entry.userId !== null)).toBe(true)
  })

  it('referees a marathon end to end without ever sending the answer early', async () => {
    const { user, cookie } = await createUser('Runner')
    const start = await request(app).post('/runs').set('Origin', ORIGIN).set('Cookie', cookie).send({ mode: 'marathon', locale: 'en' })
    expect(start.status).toBe(201)
    expect(JSON.stringify(start.body)).not.toContain('correctIndex')
    let run = start.body.value

    // Answer three correctly, reading the answer from the database as a perfect player would.
    for (let index = 0; index < 3; index++) {
      const row = await prisma.run.findUniqueOrThrow({ where: { id: run.id } })
      const question = await prisma.question.findUniqueOrThrow({ where: { id: row.currentQuestionId! } })
      const shown = row.currentOrder.indexOf(question.correctIndex)
      expect(run.question.options[shown]).toBe(question.options[question.correctIndex])

      const answer = await request(app)
        .post(`/runs/${run.id}/answer`)
        .set('Origin', ORIGIN)
        .set('Cookie', cookie)
        .send({ questionId: run.question.id, index: shown })
      expect(answer.body.value.correct).toBe(true)
      run = answer.body.value.run
      expect(run.score).toBe(index + 1)
    }

    // 50:50 removes two wrong options, then a wrong answer ends the run.
    const lifeline = await request(app).post(`/runs/${run.id}/lifeline`).set('Origin', ORIGIN).set('Cookie', cookie).send({ lifeline: 'fiftyFifty' })
    expect(lifeline.body.value.removed).toHaveLength(2)
    const again = await request(app).post(`/runs/${run.id}/lifeline`).set('Origin', ORIGIN).set('Cookie', cookie).send({ lifeline: 'fiftyFifty' })
    expect(again.status).toBe(409)

    const row = await prisma.run.findUniqueOrThrow({ where: { id: run.id } })
    const question = await prisma.question.findUniqueOrThrow({ where: { id: row.currentQuestionId! } })
    const correctShown = row.currentOrder.indexOf(question.correctIndex)
    const wrong = [0, 1, 2, 3].find((index) => index !== correctShown && !row.removedIndexes.includes(index))!
    const end = await request(app).post(`/runs/${run.id}/answer`).set('Origin', ORIGIN).set('Cookie', cookie).send({ questionId: run.question.id, index: wrong })
    expect(end.body.value.correct).toBe(false)
    expect(end.body.value.correctIndex).toBe(correctShown)
    expect(end.body.value.run.status).toBe('finished')

    const board = await request(app).get('/leaderboards').query({ mode: 'marathon', q: 'Runner' })
    expect(board.body.value.entries.some((entry: { userId: string; score: number }) => entry.userId === user.id && entry.score === 3)).toBe(true)
  })

  it('switches the question, revealing only the discarded answer, with the preview allowance', async () => {
    const { cookie } = await createUser('Switcher')
    const start = await request(app).post('/runs').set('Origin', ORIGIN).set('Cookie', cookie).send({ mode: 'marathon', locale: 'en' })
    const run = start.body.value
    const before = await prisma.run.findUniqueOrThrow({ where: { id: run.id } })
    const discarded = await prisma.question.findUniqueOrThrow({ where: { id: before.currentQuestionId! } })

    const switched = await request(app).post(`/runs/${run.id}/lifeline`).set('Origin', ORIGIN).set('Cookie', cookie).send({ lifeline: 'switchQuestion' })
    const value = switched.body.value
    expect(value.switched.correctIndex).toBe(before.currentOrder.indexOf(discarded.correctIndex))
    expect(value.run.question.id).not.toBe(discarded.id)
    // The new question's answer is still secret.
    expect(JSON.stringify(value.run)).not.toContain('correctIndex')

    const deadlineMs = Date.parse(value.run.deadline) - Date.parse(value.run.serverNow)
    expect(deadlineMs).toBeGreaterThan(MARATHON_RULES.questionSeconds * 1000)
    expect(deadlineMs).toBeLessThanOrEqual(MARATHON_RULES.questionSeconds * 1000 + SWITCH_PREVIEW_MS)
  })

  it('refuses an answer that arrives after the deadline', async () => {
    const { cookie } = await createUser('Slowpoke')
    const start = await request(app).post('/runs').set('Origin', ORIGIN).set('Cookie', cookie).send({ mode: 'marathon', locale: 'en' })
    const run = start.body.value
    await prisma.run.update({ where: { id: run.id }, data: { currentDeadline: new Date(Date.now() - 60_000) } })

    const answer = await request(app).post(`/runs/${run.id}/answer`).set('Origin', ORIGIN).set('Cookie', cookie).send({ questionId: run.question.id, index: 0 })
    expect(answer.body.value.timedOut).toBe(true)
    expect(answer.body.value.run.status).toBe('finished')
  })

  it("does not let one player touch another's run", async () => {
    const owner = await createUser('Owner')
    const other = await createUser('Other')
    const start = await request(app).post('/runs').set('Origin', ORIGIN).set('Cookie', owner.cookie).send({ mode: 'timeAttack', locale: 'en' })
    const response = await request(app).get(`/runs/${start.body.value.id}`).set('Cookie', other.cookie)
    expect(response.status).toBe(404)
  })
})

describe('classic sync', () => {
  it('stores a game once however often it is synced', async () => {
    const { cookie, user } = await createUser('Syncer')
    const game = {
      clientId: '11111111-2222-4333-8444-555555555555',
      locale: 'en',
      reachedStage: 10,
      winnings: 32000,
      outcome: 'walked',
      lifelinesUsed: ['fiftyFifty'],
      playedAt: new Date().toISOString(),
    }
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await request(app).post('/classic/sync').set('Origin', ORIGIN).set('Cookie', cookie).send({ games: [game] })
      expect(response.body.value.acceptedClientIds).toEqual([game.clientId])
    }
    expect(await prisma.classicGame.count({ where: { userId: user.id } })).toBe(1)
  })

  it('rejects implausible winnings', async () => {
    const { cookie } = await createUser('Cheater')
    const response = await request(app)
      .post('/classic/sync')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .send({ games: [{ clientId: '21111111-2222-4333-8444-555555555555', locale: 'en', reachedStage: 1, winnings: 123, outcome: 'won', playedAt: new Date().toISOString() }] })
    expect(response.body.value.acceptedClientIds).toEqual([])
  })
})

describe('avatar upload', () => {
  it('accepts an image and serves it as a 256px webp', async () => {
    const { cookie } = await createUser('Pic')
    const png = await sharp({ create: { width: 600, height: 400, channels: 3, background: '#336699' } }).png().toBuffer()
    const response = await request(app).post('/profile/avatar').set('Origin', ORIGIN).set('Cookie', cookie).attach('avatar', png, 'me.png')
    expect(response.status).toBe(200)
    expect(response.body.value.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.webp$/)

    const file = await request(app).get(response.body.value.avatarUrl)
    expect(file.status).toBe(200)
    const meta = await sharp(file.body).metadata()
    expect([meta.width, meta.height, meta.format]).toEqual([256, 256, 'webp'])
  })

  it('refuses a file that is not an image', async () => {
    const { cookie } = await createUser('NotPic')
    const response = await request(app)
      .post('/profile/avatar')
      .set('Origin', ORIGIN)
      .set('Cookie', cookie)
      .attach('avatar', Buffer.from('#!/bin/sh\necho hi'), { filename: 'evil.png', contentType: 'image/png' })
    expect(response.status).toBe(400)
  })
})

describe('contact', () => {
  const message = { name: 'Ann', email: 'ann@example.com', message: 'Question 7 has two right answers.', locale: 'en', website: '' }

  it('accepts a message (printed, not mailed, without a mail key) and validates it', async () => {
    expect((await request(app).post('/contact').set('Origin', ORIGIN).send(message)).body).toEqual({ value: true, error: null })
    expect((await request(app).post('/contact').set('Origin', ORIGIN).send({ ...message, email: 'nope' })).status).toBe(400)
    expect((await request(app).post('/contact').set('Origin', ORIGIN).send({ ...message, message: '  ' })).status).toBe(400)
  })

  it('answers a filled honeypot with a success that sends nothing', async () => {
    const response = await request(app).post('/contact').set('Origin', ORIGIN).send({ ...message, email: 'x', website: 'spam.example' })
    expect(response.body.value).toBe(true)
  })
})
