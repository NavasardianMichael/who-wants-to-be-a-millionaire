export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, '')
    .trim()
}
