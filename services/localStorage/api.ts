import { GetQuizAPI } from '@/api/getQuiz'
import { QuizItem } from '@/store/game/types'
import { SafeHavenStage } from '@/types/game'
import { Language } from '@/types/settings'
import AsyncStorage from '@react-native-async-storage/async-storage'
import i18next from 'i18next'
import { LOCAL_STORAGE_KEYS } from './constants'
import { LocalStorageData } from './types'

export const getLocalStorageItemJSON = async <T>(
  key: keyof typeof LOCAL_STORAGE_KEYS,
): Promise<T> => {
  const jsonString = await AsyncStorage.getItem(key)
  try {
    return jsonString != null ? JSON.parse(jsonString) : ({} as T)
  } catch (error) {
    console.warn('Error parsing JSON from local storage:', error)
    return {} as T
  }
}

export const getLastQuestionNumberBySafeHavenNumberByLanguage = async (
  language: Language,
) => {
  const lastQuestionNumberBySafeHavenNumber = await getLocalStorageItemJSON<
    LocalStorageData['lastQuestionNumberBySafeHavenNumberByLanguage']
  >(LOCAL_STORAGE_KEYS.lastQuestionNumberBySafeHavenNumberByLanguage)
  const result = lastQuestionNumberBySafeHavenNumber[language]
  if (!result) {
    const initialValue: LocalStorageData['lastQuestionNumberBySafeHavenNumberByLanguage'] =
      {
        en: {
          1: 0,
          2: 0,
          3: 0,
        },
        ru: {
          1: 0,
          2: 0,
          3: 0,
        },
        am: {
          1: 0,
          2: 0,
          3: 0,
        },
      }
    AsyncStorage.setItem(
      LOCAL_STORAGE_KEYS.lastQuestionNumberBySafeHavenNumberByLanguage,
      JSON.stringify(initialValue),
    )
    return initialValue[language]
  }
  return result
}

export const setLastQuestionNumberBySafeHavenNumberByLanguage = async ({
  language,
  quizItemId,
}: {
  language: Language
  quizItemId: QuizItem['id']
}) => {
  const [safeHavenNumber, questionNumber] = quizItemId.split('-')
  AsyncStorage.mergeItem(
    LOCAL_STORAGE_KEYS.lastQuestionNumberBySafeHavenNumberByLanguage,
    JSON.stringify({
      [language]: {
        [+safeHavenNumber]: +questionNumber,
      },
    }),
  )
}

export const getNextQuizItemByLanguageAndSafeHavenNumber = async ({
  language,
  safeHavenNumber,
}: {
  language: Language
  safeHavenNumber: number
}) => {
  const response: GetQuizAPI['response'] = i18next.getResourceBundle(
    language,
    'translation',
  )

  const lastQuestionNumbersBySafeHavenNumber = (
    await getLastQuestionNumberBySafeHavenNumberByLanguage(language)
  )[safeHavenNumber as SafeHavenStage]

  const quizItemsBySafeHavenNumber = response.quiz[safeHavenNumber - 1]
  const mustFetchFirstQuestion =
    lastQuestionNumbersBySafeHavenNumber >= quizItemsBySafeHavenNumber.length
  const newQuizItem =
    quizItemsBySafeHavenNumber[
      mustFetchFirstQuestion ? 1 : lastQuestionNumbersBySafeHavenNumber
    ]
  debugger

  const processQuizItem: QuizItem = {
    id: newQuizItem.id,
    question: newQuizItem.question,
    options: newQuizItem.options,
    answeredOptionSerialNumber: null,
    correctOptionSerialNumber: newQuizItem.answer,
  }

  setLastQuestionNumberBySafeHavenNumberByLanguage({
    language,
    quizItemId: newQuizItem.id,
  })

  return processQuizItem
}
