export const ENDPOINTS = {
  runs: '/runs',
  run: (id: string) => `/runs/${id}`,
  answer: (id: string) => `/runs/${id}/answer`,
  lifeline: (id: string) => `/runs/${id}/lifeline`,
} as const
