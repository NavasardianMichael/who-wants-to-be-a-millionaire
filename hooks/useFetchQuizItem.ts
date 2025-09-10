import { QUESTION_STAGES } from '@/constants/game'
import { getLocalStorageItemJSON } from '@/services/localStorage/api'
import { LOCAL_STORAGE_KEYS } from '@/services/localStorage/constants'
import { LocalStorageData } from '@/services/localStorage/types'
import { useGameStore } from '@/store/game/store'
import { GameState, QuizItem } from '@/store/game/types'
import { useSettingsStore } from '@/store/settings/store'
import { OptionSerialNumber } from '@/types/game'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { sha256 } from 'js-sha256'
import { useCallback } from 'react'

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]|_/g, '')
    .trim()
}

// Convert text to word frequency map
function textToVector(text: string): Record<string, number> {
  const words = normalize(text).split(/\s+/)
  const freq: Record<string, number> = {}
  for (const w of words) {
    freq[w] = (freq[w] || 0) + 1
  }
  return freq
}

// Compute cosine similarity between two texts
function cosineSimilarity(a: string, b: string): number {
  const vecA = textToVector(a)
  const vecB = textToVector(b)

  let dot = 0
  let magA = 0
  let magB = 0

  for (const word in vecA) {
    if (vecB[word]) {
      dot += vecA[word] * vecB[word]
    }
    magA += vecA[word] ** 2
  }

  for (const word in vecB) {
    magB += vecB[word] ** 2
  }

  magA = Math.sqrt(magA)
  magB = Math.sqrt(magB)

  return dot / (magA * magB || 1)
}

export const useFetchQuizItem = () => {
  const SIMILARITY_THRESHOLD = 0.85
  const { difficulty, language } = useSettingsStore()
  const { currentQuestionStage, initNextQuizItem, quiz } = useGameStore()

  const hasBeenAsked = useCallback(
    async (q: QuizItem['question']) => {
      const pendingQuestionNormalizedText = normalize(q)
      const pendingQuestionHash = sha256(pendingQuestionNormalizedText)

      const hasPreviouslyAskedInSession = quiz.some((x) => x.question === q)
      if (hasPreviouslyAskedInSession) return true

      const askedQuestionHashesByLanguage = await getLocalStorageItemJSON<
        LocalStorageData['askedQuestionHashesByLanguage']
      >(LOCAL_STORAGE_KEYS.askedQuestionHashesByLanguage)
      const previousQuestionHashes =
        askedQuestionHashesByLanguage?.[language] || []

      return previousQuestionHashes.some(
        (hash) =>
          hash === pendingQuestionHash ||
          cosineSimilarity(pendingQuestionNormalizedText, hash) >=
            SIMILARITY_THRESHOLD
      )
    },
    [language, quiz]
  )

  return useCallback(
    async (stage?: GameState['currentQuestionStage']) => {
      const fetchForStage =
        stage ?? ((currentQuestionStage + 1) as OptionSerialNumber)
      console.log({ fetchForStage })

      if (fetchForStage <= QUESTION_STAGES.length) {
        const payload = {
          stage: fetchForStage,
          difficulty,
          language,
        }
        const question = await initNextQuizItem(payload)
        if (await hasBeenAsked(question)) {
          console.warn('Question has been asked before, fetching again...')
          return await initNextQuizItem(payload)
        }

        const pendingQuestionNormalizedText = normalize(question)
        const askedQuestionHashesByLanguage = await getLocalStorageItemJSON<
          LocalStorageData['askedQuestionHashesByLanguage']
        >(LOCAL_STORAGE_KEYS.askedQuestionHashesByLanguage)
        const previousQuestionHashes =
          askedQuestionHashesByLanguage?.[language] || []
        AsyncStorage.mergeItem(
          LOCAL_STORAGE_KEYS.askedQuestionHashesByLanguage,
          JSON.stringify({
            [language]: [
              ...previousQuestionHashes,
              sha256(pendingQuestionNormalizedText),
            ],
          })
        )
        return question
      }
    },
    [currentQuestionStage, difficulty, language, initNextQuizItem, hasBeenAsked]
  )
}
