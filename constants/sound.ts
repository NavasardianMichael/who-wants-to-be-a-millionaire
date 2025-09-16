import audienceHelpSound from '@/assets/audio/audience-help.mp3'
import correctAnswerSound from '@/assets/audio/correct-answer.mp3'
import easyQuestionSound from '@/assets/audio/easy.mp3'
import fiftyFiftySound from '@/assets/audio/fifty-fifty.mp3'
import finalAnswerSound from '@/assets/audio/final-answer.mp3'
import hardAnswerSound from '@/assets/audio/hard.mp3'
import mainThemeSound from '@/assets/audio/main-theme.mp3'
import mediumAnswerSound from '@/assets/audio/medium.mp3'
import nextQuestionSound from '@/assets/audio/next.mp3'
import phoneAFriendSound from '@/assets/audio/phone-a-friend.mp3'
import resignSound from '@/assets/audio/resign.mp3'
import wrongAnswerSound from '@/assets/audio/wrong-answer.mp3'
import youWonMillionSound from '@/assets/audio/you-won-a-million.mp3'

export const SOUNDS_URIS = {
  audienceHelp: audienceHelpSound,
  correctAnswer: correctAnswerSound,
  easy: easyQuestionSound,
  fiftyFifty: fiftyFiftySound,
  finalAnswer: finalAnswerSound,
  hard: hardAnswerSound,
  mainTheme: mainThemeSound,
  medium: mediumAnswerSound,
  next: nextQuestionSound,
  phoneAFriend: phoneAFriendSound,
  resign: resignSound,
  wrongAnswer: wrongAnswerSound,
  youWonMillion: youWonMillionSound,
} as const

export const SOUND_DURATION_BY_URI: Record<
  (typeof SOUNDS_URIS)[keyof typeof SOUNDS_URIS],
  number
> = {
  [SOUNDS_URIS.audienceHelp]: 5460,
  [SOUNDS_URIS.correctAnswer]: 8072,
  [SOUNDS_URIS.easy]: 75651,
  [SOUNDS_URIS.fiftyFifty]: 3109,
  [SOUNDS_URIS.finalAnswer]: 29989,
  [SOUNDS_URIS.hard]: 160183,
  [SOUNDS_URIS.mainTheme]: 32313,
  [SOUNDS_URIS.medium]: 56712,
  [SOUNDS_URIS.next]: 6870,
  [SOUNDS_URIS.phoneAFriend]: 9169,
  [SOUNDS_URIS.resign]: 5695,
  [SOUNDS_URIS.wrongAnswer]: 5799,
  [SOUNDS_URIS.youWonMillion]: 3030,
}

export const SOUNDS_IDS_BY_SAFE_HAVEN = [
  SOUNDS_URIS.easy,
  SOUNDS_URIS.medium,
  SOUNDS_URIS.hard,
]

export const SOUND_ID_BY_LIFELINE = {
  fiftyFifty: SOUNDS_URIS.fiftyFifty,
  askAudience: SOUNDS_URIS.audienceHelp,
  phoneAFriend: SOUNDS_URIS.phoneAFriend,
  switchQuestion: SOUNDS_URIS.fiftyFifty,
}
