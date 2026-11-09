export const ENDPOINTS = {
  batch: '/questions/batch',
  samples: '/questions/samples',
  packs: '/questions/packs',
  shown: '/questions/shown',
  report: (id: string) => `/questions/${id}/report`,
} as const
