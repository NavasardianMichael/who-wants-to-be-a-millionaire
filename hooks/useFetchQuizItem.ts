import { QUESTION_STAGES } from '@/constants/game'
import { sleep } from '@/helpers/commons'
import { getAskedQuestionsByLanguage } from '@/services/localStorage/api'
import { useGameStore } from '@/store/game/store'
import { GameState, QuizItem } from '@/store/game/types'
import { useSettingsStore } from '@/store/settings/store'
import { OptionSerialNumber } from '@/types/game'
import { useCallback } from 'react'

export const useFetchQuizItem = () => {
  const { difficulty, language } = useSettingsStore()
  const { currentQuestionStage, initNextQuizItem, quiz } = useGameStore()

  const hasBeenAsked = useCallback(
    async (pendingQuestion: QuizItem['question']) => {
      const hasPreviouslyAskedInSession = quiz.some((item) => item.question === pendingQuestion)
      if (hasPreviouslyAskedInSession) return true

      const askedQuestionsByLanguage = await getAskedQuestionsByLanguage()
      const previousQuestions = askedQuestionsByLanguage?.[language] || []
      console.log({ previousQuestions });

      return previousQuestions.some(
        (question) => question === pendingQuestion
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
          await sleep(1000)
          return await initNextQuizItem(payload)
        }
        return question
      }
    },
    [currentQuestionStage, difficulty, language, initNextQuizItem, hasBeenAsked]
  )
}
