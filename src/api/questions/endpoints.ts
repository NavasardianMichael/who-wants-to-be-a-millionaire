export const ENDPOINTS = {
  batch: '/questions/batch',
  samples: '/questions/samples',
  packs: '/questions/packs',
  report: (id: string) => `/questions/${id}/report`,
} as const
