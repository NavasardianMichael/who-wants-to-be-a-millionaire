import { clip, generateJson, isAiConfigured, type JsonSchema } from '../lib/ai/index.js'
import { type Level, OPTION_LETTERS } from '../lib/game.js'
import { type FriendConfidence, friendPick } from '../lib/lifelines.js'
import { type Locale, LOCALE_INFO, type LocaleInfo } from '../lib/locales.js'
import { prisma } from '../lib/prisma.js'

/**
 * Phone a Friend. **Code decides, the model only speaks.** `friendPick` chooses the answer
 * and how confident the friend is, from the level-based accuracy table; the model is then asked
 * to voice exactly that choice as a short, natural phone reply in the player's language.
 *
 * If the model's reply does not name the chosen option, it is discarded (`message: null`)
 * and the web app falls back to a translated template — a friend who "says B" while the
 * hint shows C would be worse than no flavour text at all.
 */
export type FriendAnswer = {
  friendName: string | null
  message: string | null
  suggestedIndex: number
  confidence: FriendConfidence
}

const FRIEND_SCHEMA: JsonSchema = {
  type: 'object',
  properties: {
    friendName: { type: 'string' },
    message: { type: 'string' },
  },
  required: ['friendName', 'message'],
}

const CONFIDENCE_TONE: Record<FriendConfidence, string> = {
  high: 'confident — you are pretty sure',
  medium: 'thoughtful — you lean towards it but admit some doubt',
  low: 'unsure — you are guessing and say so',
}

export type FriendRequest = {
  locale: Locale
  question: string
  options: string[]
  correctIndex: number
  removed: number[]
  level: Level
  /** The signed-in player's display name; without one the friend never names the caller. */
  playerName?: string | null
}

/** The display name the friend may greet the caller by — null when signed out or unknown. */
export const playerNameOf = async (userId: string | undefined): Promise<string | null> => {
  if (!userId) return null
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { displayName: true } })
  return user?.displayName.trim() || null
}

/**
 * True when the reply names the option: by its letter as a standalone word ("B", "B:" — not
 * the B inside "Bonjour"), or by its text.
 */
export const mentionsOption = (message: string, letter: string, optionText: string): boolean => {
  if (message.split(/[^\p{L}]+/u).includes(letter)) return true
  const option = optionText.toLocaleLowerCase()
  return option.length > 1 && message.toLocaleLowerCase().includes(option)
}

export const callFriend = async (request: FriendRequest): Promise<FriendAnswer> => {
  const pick = friendPick(request.correctIndex, request.removed, request.level)
  const base: FriendAnswer = { friendName: null, message: null, suggestedIndex: pick.index, confidence: pick.confidence }
  if (!isAiConfigured()) return base

  const { name, culture, writing }: LocaleInfo = LOCALE_INFO[request.locale]
  const letter = OPTION_LETTERS[pick.index]!
  const optionText = request.options[pick.index]!
  const board = request.options
    .map((option, index) => (request.removed.includes(index) ? null : `${OPTION_LETTERS[index]}: ${option}`))
    .filter(Boolean)
    .join('\n')

  try {
    const { text } = await generateJson({
      systemInstruction: [
        `You play the friend a quiz-game player calls for help with a question. Reply in natural, spoken ${name} only.`,
        writing ?? '',
        `Invent a first name that is common in ${culture} for yourself (friendName).`,
        request.playerName
          ? `The caller is called ${JSON.stringify(request.playerName)}; you may address them by that name.`
          : "You do not know the caller's name: never address them by a name or invent one for them.",
        'message: what you say on the phone, at most 35 words. Think out loud briefly, then name your answer with its letter.',
        'You must choose exactly the answer you are told to choose — never mention a different option as your answer.',
      ]
        .filter(Boolean)
        .join('\n'),
      contents: `Question: ${request.question}\nOptions:\n${board}\n\nYour answer: ${letter} (${optionText}).\nYour tone: ${CONFIDENCE_TONE[pick.confidence]}.`,
      schema: FRIEND_SCHEMA,
      maxOutputTokens: 1024,
    })

    const parsed = JSON.parse(text) as { friendName?: unknown; message?: unknown }
    const message = clip(parsed.message, 280)
    const friendName = clip(parsed.friendName, 30) || null

    if (!message || !mentionsOption(message, letter, optionText)) return { ...base, friendName }
    return { ...base, friendName, message }
  } catch (error) {
    console.warn('[phone-a-friend] fell back to the template:', (error as Error).message)
    return base
  }
}
