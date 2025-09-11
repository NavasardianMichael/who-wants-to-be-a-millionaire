import { DIFFICULTY_LEVELS } from '@/constants/settings'
import { QuizItem } from '@/store/game/types'
import { Difficulty, Language } from '@/types/settings'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: 'AIzaSyByfE5ZWmM85QoGYNxfFn0f62ty8hv5mgo',
})

export type FetchQuizItemAPI = {
  payload: {
    stage: number
    language: Language
    difficulty: Difficulty
    askedQuestions: QuizItem['question'][]
  }
  response: Promise<
    | (Pick<QuizItem, 'question' | 'options'> & {
      answerIndex: number
    })
    | undefined
  >
}

export const fetchQuestion = async ({
  stage,
  language,
  difficulty,
  askedQuestions
}: FetchQuizItemAPI['payload']): FetchQuizItemAPI['response'] => {
  console.log({ askedQuestions });

  const difficultyLevelSerialNumber = DIFFICULTY_LEVELS.indexOf(difficulty) + 1
  try {
    const response = await ai.models.generateContent({
      config: {
        responseMimeType: 'application/json',
        temperature: 0.9,
        responseSchema: {
          type: 'OBJECT',
          properties: {
            question: { type: 'STRING' },
            answerIndex: { type: 'NUMBER' },
            options: {
              type: 'ARRAY',
              items: { type: 'STRING' },
            },
          },
        },
      },
      model: 'gemini-2.5-flash',
      contents: `We are playing "Who Wants to Be a Millionaire".
      You are the game's question creator.
      Create one question in ${language} language, the overall difficulty level should be ${difficultyLevelSerialNumber}/${DIFFICULTY_LEVELS.length}. The question difficulty should be for stage ${stage} out of 15 stages. The question can be not only country or language-specific, but about a globally recognized topic as well (e.g., science, history, geography, arts, pop culture). Return a json, which has 3 properties: question (question text), options: (array of 4 string options), answerIndex: (index of the correct answer).
      The answers should be short and specific, without explanation.
      Among the answers there should be one correct option and 3 wrong options. ${askedQuestions.length ? 'Do not repeat these questions: ' + askedQuestions.join('; ') + '.' : ''}`,
    })

    const jsonString = response?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!jsonString) {
      throw new Error('No content found in API response.')
    }

    const quizItem: FetchQuizItemAPI['response'] = JSON.parse(jsonString)
    console.log({
      stage,
      language,
      difficulty,
      quizItem,
    })

    return quizItem
  } catch (error) {
    console.error('Error generating word:', error)
  }
}
