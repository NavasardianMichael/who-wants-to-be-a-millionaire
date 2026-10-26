import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { config } from '../config.js'
import { fail, ok } from '../lib/api-response.js'
import { RANKED_MODES } from '../lib/game.js'
import { isLocale } from '../lib/locales.js'
import { prisma } from '../lib/prisma.js'
import { asBoundedString } from '../lib/request.js'
import { toSessionUser } from '../mappers/entities.js'
import { requireAuth } from '../middleware/auth.js'
import { asyncHandler } from '../middleware/error.js'
import { rateLimit } from '../middleware/rateLimit.js'
import { getRankSummary } from '../services/leaderboard.js'

export const profileRouter = Router()

profileRouter.use(requireAuth)

const AVATAR_DIR = 'avatars'
const AVATAR_SIZE = 256
const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

/**
 * Memory storage: the upload never touches disk as-is. `sharp` decodes it (which is the
 * real content check — a renamed executable fails here), strips metadata, and writes a
 * fixed-size webp. The MIME check only spares sharp the obviously wrong.
 */
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => callback(null, ACCEPTED_TYPES.has(file.mimetype)),
})

const MIN_NAME = 2
const MAX_NAME = 24

const removeUploadedAvatar = async (avatarPath: string | null): Promise<void> => {
  if (!avatarPath?.startsWith(`/uploads/${AVATAR_DIR}/`)) return
  await unlink(path.join(config.uploadDir, avatarPath.replace('/uploads/', ''))).catch((error: unknown) => {
    console.warn('[profile] could not delete old avatar', (error as Error).message)
  })
}

/** GET /profile — the account plus everything the profile page shows. */
profileRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.session!.userId
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return fail(res, 'Unauthorized', 401, 401)

    const [classicBest, classicCount, badges, ...ranks] = await Promise.all([
      prisma.classicGame.findFirst({ where: { userId }, orderBy: [{ winnings: 'desc' }, { playedAt: 'asc' }] }),
      prisma.classicGame.count({ where: { userId } }),
      prisma.userBadge.findMany({ where: { userId }, orderBy: { earnedAt: 'asc' } }),
      ...RANKED_MODES.map((mode) => getRankSummary(userId, mode)),
    ])

    return ok(res, {
      user: toSessionUser(user),
      classic: {
        bestWinnings: classicBest?.winnings ?? 0,
        bestStage: classicBest?.reachedStage ?? 0,
        gamesPlayed: classicCount,
      },
      ranked: Object.fromEntries(RANKED_MODES.map((mode, index) => [mode, ranks[index] ?? null])),
      badges: badges.map(({ badgeId, earnedAt }) => ({ badgeId, earnedAt: earnedAt.toISOString() })),
    })
  })
)

/** PATCH /profile — display name and preferred language. */
profileRouter.patch(
  '/',
  asyncHandler(async (req, res) => {
    const data: { displayName?: string; locale?: string } = {}

    if (req.body?.displayName !== undefined) {
      const displayName = asBoundedString(req.body.displayName, MAX_NAME + 1)
      if (!displayName || displayName.length < MIN_NAME || displayName.length > MAX_NAME) {
        return fail(res, `displayName must be ${MIN_NAME}-${MAX_NAME} characters`, 400)
      }
      // No control or zero-width characters — they make two names look identical on the board.
      if (/[\p{Cc}\p{Cf}]/u.test(displayName)) return fail(res, 'displayName contains invalid characters', 400)
      data.displayName = displayName
    }

    if (req.body?.locale !== undefined) {
      if (!isLocale(req.body.locale)) return fail(res, 'Unsupported locale', 400)
      data.locale = req.body.locale
    }

    const user = await prisma.user.update({ where: { id: req.session!.userId }, data })
    return ok(res, toSessionUser(user))
  })
)

/** POST /profile/avatar — multipart field `avatar`. */
profileRouter.post(
  '/avatar',
  rateLimit('avatar', { limit: 10, windowMs: 60 * 60 * 1000 }),
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) return fail(res, 'An image file (jpeg, png, webp, gif or avif) is required', 400)

    let image: Buffer
    try {
      image = await sharp(req.file.buffer, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'attention' })
        .webp({ quality: 82 })
        .toBuffer()
    } catch {
      return fail(res, 'The file is not a readable image', 400)
    }

    const userId = req.session!.userId
    const fileName = `${userId}-${randomUUID().slice(0, 8)}.webp`
    const dir = path.join(config.uploadDir, AVATAR_DIR)
    await mkdir(dir, { recursive: true })
    await writeFile(path.join(dir, fileName), image)

    const previous = await prisma.user.findUnique({ where: { id: userId }, select: { avatarPath: true } })
    const user = await prisma.user.update({
      where: { id: userId },
      data: { avatarPath: `/uploads/${AVATAR_DIR}/${fileName}` },
    })
    await removeUploadedAvatar(previous?.avatarPath ?? null)

    return ok(res, toSessionUser(user))
  })
)

/** DELETE /profile/avatar — back to the Google photo. */
profileRouter.delete(
  '/avatar',
  asyncHandler(async (req, res) => {
    const userId = req.session!.userId
    const previous = await prisma.user.findUnique({ where: { id: userId }, select: { avatarPath: true } })
    const user = await prisma.user.update({ where: { id: userId }, data: { avatarPath: null } })
    await removeUploadedAvatar(previous?.avatarPath ?? null)
    return ok(res, toSessionUser(user))
  })
)
