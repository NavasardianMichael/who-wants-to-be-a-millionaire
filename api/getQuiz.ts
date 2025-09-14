import { getLastQuestionNumberBySafeHavenNumberByLanguage } from '@/services/localStorage/api'
import { GameState, QuizItem } from '@/store/game/types'
import { SafeHavenStage } from '@/types/game'
import { Language } from '@/types/settings'
import i18next from 'i18next'

export type GetQuizAPI = {
  payload: {
    language: Language
  }
  response: {
    quiz: {
      id: QuizItem['id']
      question: QuizItem['question']
      options: QuizItem['options']
      answer: QuizItem['correctOptionSerialNumber']
    }[][]
  }
  processed: GameState['quiz']
}

export const getQuiz = async ({
  language,
}: GetQuizAPI['payload']): Promise<GetQuizAPI['processed'] | undefined> => {
  try {
    const response: GetQuizAPI['response'] = i18next.getResourceBundle(
      language,
      'translation'
    )

    const lastQuestionNumbersBySafeHavenNumber =
      await getLastQuestionNumberBySafeHavenNumberByLanguage(language)
    console.log({ lastQuestionNumbersBySafeHavenNumber, language })

    const processed: GetQuizAPI['processed'] = response.quiz.reduce(
      (acc, safeHavenList, index) => {
        const lastQuestionNumberBySafeHavenNumber =
          lastQuestionNumbersBySafeHavenNumber[(index + 1) as SafeHavenStage] ??
          0
        const processedSafeHavenList = safeHavenList
          .slice(lastQuestionNumberBySafeHavenNumber, 5)
          .map((quizItem) => {
            return {
              id: quizItem.id,
              question: quizItem.question,
              options: quizItem.options,
              answeredOptionSerialNumber: null,
              correctOptionSerialNumber: quizItem.answer,
            }
          })
        return acc.concat(processedSafeHavenList)
      },
      [] as GetQuizAPI['processed']
    )

    return processed
  } catch (error) {
    console.error('Error generating word:', error)
  }
}
