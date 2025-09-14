import { OptionSerialNumber } from '@/types/game'

export const QUESTION_STAGES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const

export const SAFE_HAVEN_STAGES = [1, 2, 3] as const

export const OPTIONS_SERIAL_NUMBERS = [1, 2, 3, 4] as const

export const CHAR_CODES_BY_OPTION_SERIAL_NUMBER: Record<
  OptionSerialNumber,
  string
> = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
}

export const LIFELINES = {
  fiftyFifty: 'fiftyFifty',
  askAudience: 'askAudience',
  phoneAFriend: 'phoneAFriend',
  switchQuestion: 'switchQuestion',
} as const
