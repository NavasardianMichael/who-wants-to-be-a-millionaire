import { QuizItem } from "@/store/game/types";
import { Language } from "@/types/settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LOCAL_STORAGE_KEYS } from "./constants";
import { LocalStorageData } from "./types";

export const getLocalStorageItemJSON = async <T>(
  key: keyof typeof LOCAL_STORAGE_KEYS
): Promise<T> => {
  const jsonString = await AsyncStorage.getItem(key);
  try {
    return jsonString != null ? JSON.parse(jsonString) : ({} as T);
  } catch (error) {
    console.warn("Error parsing JSON from local storage:", error);
    return {} as T;
  }
};

export const getLastQuestionNumberBySafeHavenNumberByLanguage = async (
  language: Language
) => {
  const lastQuestionNumberBySafeHavenNumber = await getLocalStorageItemJSON<
    LocalStorageData["lastQuestionNumberBySafeHavenNumberByLanguage"]
  >(LOCAL_STORAGE_KEYS.lastQuestionNumberBySafeHavenNumberByLanguage);
  const result = lastQuestionNumberBySafeHavenNumber[language];
  if (!result) {
    const initialValue: LocalStorageData["lastQuestionNumberBySafeHavenNumberByLanguage"] =
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
      };
    AsyncStorage.setItem(
      LOCAL_STORAGE_KEYS.lastQuestionNumberBySafeHavenNumberByLanguage,
      JSON.stringify(initialValue)
    );
    return initialValue[language];
  }
  return result;
};

export const setLastQuestionNumberBySafeHavenNumberByLanguage = async ({
  language,
  quizItemId,
}: {
  language: Language;
  quizItemId: QuizItem["id"];
}) => {
  // const lastQuestionNumberBySafeHavenNumber = await getLocalStorageItemJSON<
  //   LocalStorageData['lastQuestionNumberBySafeHavenNumberByLanguage']
  // >(LOCAL_STORAGE_KEYS.lastQuestionNumberBySafeHavenNumberByLanguage)

  // const updatedValue = {
  //   ...lastQuestionNumberBySafeHavenNumber,
  //   [language]: {
  //     ...lastQuestionNumberBySafeHavenNumber[language],
  //     [safeHavenNumber]: questionNumber,
  //   },
  // }

  // AsyncStorage.setItem(
  //   LOCAL_STORAGE_KEYS.lastQuestionNumberBySafeHavenNumberByLanguage,
  //   JSON.stringify(updatedValue)
  // )
  const [safeHavenNumber, questionNumber] = quizItemId.split("-");
  AsyncStorage.mergeItem(
    LOCAL_STORAGE_KEYS.lastQuestionNumberBySafeHavenNumberByLanguage,
    JSON.stringify({
      [language]: {
        [+safeHavenNumber]: +questionNumber,
      },
    })
  );
};
