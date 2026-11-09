import request from 'supertest'
import { afterAll, describe, expect, it } from 'vitest'
import { ORIGIN, prisma } from './helpers'
import { createApp } from '../../server/src/app'

/**
 * The limits on the endpoints that hand out answers. A file of its own: it spends the
 * limiters, which live as long as the module does, and would starve the other files' calls.
 */
const app = createApp()

afterAll(async () => {
  await prisma.$disconnect()
})

describe('answer-carrying endpoints', () => {
  it('cuts off a script pulling batches after 15 a minute', async () => {
    const batch = () => request(app).post('/questions/batch').set('Origin', ORIGIN).send({ locale: 'en', counts: { 1: 1 } })
    for (let call = 0; call < 15; call++) expect((await batch()).status).toBe(200)

    const refused = await batch()
    expect(refused.status).toBe(429)
    expect(Number(refused.headers['retry-after'])).toBeGreaterThan(0)
  })

  it('cuts off pack downloads after 10 an hour', async () => {
    for (let call = 0; call < 10; call++) expect((await request(app).get('/questions/packs/en')).status).toBe(200)
    expect((await request(app).get('/questions/packs/en')).status).toBe(429)
  })
})
