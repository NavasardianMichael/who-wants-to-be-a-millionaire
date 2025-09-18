import {
  getLastQuestionNumberBySafeHavenNumberByLanguage,
  setLastQuestionNumberBySafeHavenNumberByLanguage,
} from '@/services/localStorage/api'
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

const processQuizItem = (
  quizItem: GetQuizAPI['response']['quiz'][0][0]
): QuizItem => {
  return {
    id: quizItem.id,
    question: quizItem.question,
    options: quizItem.options,
    answeredOptionSerialNumber: null,
    correctOptionSerialNumber: quizItem.answer,
  }
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

    const processed: GetQuizAPI['processed'] = response.quiz.reduce(
      (acc, safeHavenList, index) => {
        const lastQuestionNumberBySafeHavenNumber =
          lastQuestionNumbersBySafeHavenNumber[(index + 1) as SafeHavenStage] ??
          0
        let processedSafeHavenList = safeHavenList
          .slice(
            lastQuestionNumberBySafeHavenNumber,
            lastQuestionNumberBySafeHavenNumber + 5
          )
          .map(processQuizItem)
        const missingQuestionsCount = 5 - processedSafeHavenList.length

        if (missingQuestionsCount > 0) {
          processedSafeHavenList = processedSafeHavenList.concat(
            safeHavenList.slice(0, missingQuestionsCount).map(processQuizItem)
          )
          setLastQuestionNumberBySafeHavenNumberByLanguage({
            language,
            quizItemId: safeHavenList[missingQuestionsCount - 1].id,
          })
        }

        return acc.concat(processedSafeHavenList)
      },
      [] as GetQuizAPI['processed']
    )
    return processed
  } catch (error) {
    console.error('Error generating word:', error)
  }
}
