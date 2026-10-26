import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import path from 'node:path'
import type Sharp from '../../server/node_modules/sharp'
import { config } from '../../server/src/config'
import { prisma } from '../../server/src/lib/prisma'
import { signSession } from '../../server/src/lib/session'

/** A user row plus the cookie header that signs in as them — Google is not involved in tests. */
export const createUser = async (displayName = 'Tester') => {
  const id = randomUUID()
  const user = await prisma.user.create({
    data: { email: `${id}@example.com`, googleId: `google-${id}`, displayName },
  })
  const cookie = `${config.cookieName}=${signSession({ userId: user.id, tokenVersion: user.tokenVersion })}`
  return { user, cookie }
}

/** Questions in the ranked reserve, which only ranked runs draw from — the seed has none. Returns their ids. */
export const createRankedQuestions = async (locale: string, level: number, count: number): Promise<string[]> => {
  const ids = Array.from({ length: count }, () => randomUUID())
  await prisma.question.createMany({
    data: ids.map((id, index) => ({
      id,
      locale,
      category: 'general',
      level,
      text: `Reserve question ${id}?`,
      options: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
      correctIndex: index % 4,
      hash: `reserve-${id}`,
      ranked: true,
    })),
  })
  return ids
}

/** Requests from the web app carry its Origin; the CSRF guard refuses any other. */
export const ORIGIN = 'http://localhost:7006'

/** `sharp` is a server dependency; resolve it from the server package. */
export const sharp = createRequire(path.resolve(__dirname, '../../server/package.json'))('sharp') as typeof Sharp

export { prisma } from '../../server/src/lib/prisma'
