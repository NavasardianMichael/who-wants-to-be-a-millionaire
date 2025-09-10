import Header from '@/components/header/Header'
import { useCurrentQuizItem } from '@/hooks/useCurrentQuizItem'
import { useFetchQuizItem } from '@/hooks/useFetchQuizItem'
import { LOCAL_STORAGE_KEYS } from '@/services/localStorage/constants'
import { useGameStore } from '@/store/game/store'
import { useSettingsStore } from '@/store/settings/store'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { Text, View } from 'react-native'
import '../styles/globals.css'

export default function RootLayout() {
  const currentQuizItem = useCurrentQuizItem()
  const fetchQuizItem = useFetchQuizItem()
  const { language, difficulty } = useSettingsStore()
  const { setGameState } = useGameStore()

  useEffect(() => {
    setGameState({ quiz: [] })
    fetchQuizItem(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  useEffect(() => {
    const setDefaultSettings = async () => {
      const localStorageLanguage = await AsyncStorage.getItem(
        LOCAL_STORAGE_KEYS.language
      )
      if (localStorageLanguage !== language)
        AsyncStorage.setItem(LOCAL_STORAGE_KEYS.language, language)

      const localStorageDifficulty = await AsyncStorage.getItem(
        LOCAL_STORAGE_KEYS.difficulty
      )
      if (localStorageDifficulty !== difficulty)
        AsyncStorage.setItem(LOCAL_STORAGE_KEYS.difficulty, difficulty)
    }
    setDefaultSettings()
  }, [difficulty, language])

  return (
    <View className='flex-1'>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#002876' },
        }}
        layout={({ children }) => (
          <View className='flex-1 flex p-lg bg-primary'>
            <Header />
            {currentQuizItem ? (
              <View className='bg-primary flex-1'>{children}</View>
            ) : (
              <View className='flex-1 justify-center items-center'>
                <View className='w-16 h-16 border-4 border-t-4 border-t-transparent border-secondary rounded-full animate-spin' />
                <Text className='text-white mt-md'>AI is Working...</Text>
              </View>
            )}
          </View>
        )}
      />
    </View>
  )
}
