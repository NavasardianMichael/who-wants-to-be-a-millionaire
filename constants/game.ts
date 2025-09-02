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
