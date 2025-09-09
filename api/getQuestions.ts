import { QuestionStage } from '@/types/game'
import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({
  apiKey: 'AIzaSyByfE5ZWmM85QoGYNxfFn0f62ty8hv5mgo',
})

export const getQuestions = async ({
  currentStage,
}: {
  currentStage: QuestionStage
}) => {
  try {
    const AIResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Խաղում ենք "Ով է ուզում դառնալ միլիոնատեր"։
      Դու ես խաղի հարցերի ստեղծողը։ 
      Ստեղծիր մեկ հարց, որը համապատասխանում է 15 փուլից այս փուլին՝ ${currentStage}։ Վերադարձիր հարցը և 4 տարբերակ՝ A, B, C, D։
      Պատասխանները պետք է լինեն կարճ և կոնկրետ, առանց բացատրության։
      Պատասխանների մեջ պետք է լինի ճիշտ տարբերակը և 3 սխալ տարբերակ։`,
    })
    console.log({ AIResponse })

    return AIResponse
  } catch (error) {
    console.error('Error generating word:', error)
  }
}
