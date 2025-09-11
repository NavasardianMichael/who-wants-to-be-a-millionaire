import AsyncStorage from '@react-native-async-storage/async-storage'
import { LOCAL_STORAGE_KEYS } from './constants'
import { LocalStorageData } from './types'

export const getLocalStorageItemJSON = async <T>(
  key: keyof typeof LOCAL_STORAGE_KEYS
): Promise<T> => {
  const jsonString = await AsyncStorage.getItem(key)
  try {
    return jsonString != null ? JSON.parse(jsonString) : ({} as T)
  } catch (error) {
    console.warn('Error parsing JSON from local storage:', error)
    return {} as T
  }
}

export const getAskedQuestionsByLanguage = async () => {
  return await getLocalStorageItemJSON<
    LocalStorageData['askedQuestionsByLanguage']
  >(LOCAL_STORAGE_KEYS.askedQuestionsByLanguage)
}