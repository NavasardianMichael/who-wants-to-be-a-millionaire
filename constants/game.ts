export const QUESTION_STAGES = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15,
] as const

export const LIFELINES = {
  fiftyFifty: 'fiftyFifty',
  askAudience: 'askAudience',
  phoneAFriend: 'phoneAFriend',
  switchQuestion: 'switchQuestion',
} as const

export const QUESTION_STAGES_TEMPLATE: {
  stage: (typeof QUESTION_STAGES)[number]
  label: string
}[] = [
    {
      stage: 1,
      label: '£100',
    },
    {
      stage: 2,
      label: '£200',
    },
    {
      stage: 3,
      label: '£300',
    },
    {
      stage: 4,
      label: '£500',
    },
    {
      stage: 5,
      label: '£1,000',
    },
    {
      stage: 6,
      label: '£2,000',
    },
    {
      stage: 7,
      label: '£4,000',
    },
    {
      stage: 8,
      label: '£8,000',
    },
    {
      stage: 9,
      label: '£16,000',
    },
    {
      stage: 10,
      label: '£32,000',
    },
    {
      stage: 11,
      label: '£64,000',
    },
    {
      stage: 12,
      label: '£125,000',
    },
    {
      stage: 13,
      label: '£250,000',
    },
    {
      stage: 14,
      label: '£500,000',
    },
    {
      stage: 15,
      label: '£1 MILLION',
    },
  ]


export const SOUNDS_URIS = {
  audienceHelp: '@/assets/audio/audienceHelp.mp3',
  correctAnswer: '@/assets/audio/correct_answer.mp3',
  doubleDipSecond: '@/assets/audio/double-dip-second.mp3',
  easy: '@/assets/audio/easy.mp3',
  easyWav: '@/assets/audio/easy.wav',
  fiftyFifty: '@/assets/audio/fiftyFifty.mp3',
  finalAnswer: '@/assets/audio/final_answer.mp3',
  hardMillion: '@/assets/audio/hard_million.mp3',
  mainTheme: '@/assets/audio/main_theme.mp3',
  medium: '@/assets/audio/medium.mp3',
  next: '@/assets/audio/next.mp3',
  resign: '@/assets/audio/resign.mp3',
  winningTheme: '@/assets/audio/winning_theme.mp3',
  wrongAnswer: '@/assets/audio/wrong_answer.mp3',
  youWonMillion: '@/assets/audio/you_won_million.mp3',
} as const