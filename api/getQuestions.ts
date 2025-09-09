import { DIFFICULTY_LEVELS } from "@/constants/settings";
import { QuizItem } from "@/store/game/types";
import { Difficulty, Language } from "@/types/settings";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: "AIzaSyByfE5ZWmM85QoGYNxfFn0f62ty8hv5mgo",
});

export type FetchQuizItemAPI = {
  payload: {
    stage: number;
    language: Language;
    difficulty: Difficulty;
  };
  response: Promise<
    | (Pick<QuizItem, "question" | "options"> & {
      answerIndex: number;
    })
    | undefined
  >;
};

export const fetchQuestion = async ({
  stage,
  language,
  difficulty,
}: FetchQuizItemAPI["payload"]): FetchQuizItemAPI["response"] => {
  const difficultyLevelSerialNumber = DIFFICULTY_LEVELS.indexOf(difficulty) + 1;
  try {
    const response = await ai.models.generateContent({
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            question: { type: "STRING" },
            answerIndex: { type: "NUMBER" },
            options: {
              type: "ARRAY",
              items: { type: "STRING" },
            },
          },
        },
      },
      model: "gemini-2.5-flash",
      contents: `We are playing "Who Wants to Be a Millionaire".
      You are the game's question creator.
      Create one question in ${language} language, the overall difficulty level should be ${difficultyLevelSerialNumber}/${DIFFICULTY_LEVELS.length}. The question difficulty should be for stage ${stage} out of 15 stages. Return a json, which has 3 properties: question (question text), options: (array of 4 string options), answerIndex: (index of the correct answer).
      The answers should be short and specific, without explanation.
      Among the answers there should be one correct option and 3 wrong options.`,
    });

    const jsonString = response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!jsonString) {
      throw new Error("No content found in API response.");
    }

    const quizItem: FetchQuizItemAPI["response"] = JSON.parse(jsonString);
    console.log({
      stage, language, difficulty,
      quizItem
    });

    return quizItem;
  } catch (error) {
    console.error("Error generating word:", error);
  }
};
