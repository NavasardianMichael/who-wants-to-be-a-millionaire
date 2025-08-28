import React, { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import AppDropdown from './components/ui/AppDropdown'
import AppLinkAsButton from './components/ui/AppLinkAsButton'
import { DIFFICULTY_LEVELS } from './constants/difficulty'
import { ROUTES } from './constants/routes'
import { LANGUAGES } from './constants/settings'
import { Difficulty } from './types/difficulty'
import { Language } from './types/languages'

const Settings = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES[1]
  )
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTY_LEVELS[2])

  const onLanguageChange = useCallback((value: Language) => {
    setSelectedLanguage(value)
  }, [])

  const onDifficultyChange = useCallback((value: Difficulty) => {
    setDifficulty(value)
  }, [])

  return (
    <View className='flex-1 bg-primary p-6'>
      <Text className='text-3xl text-center text-white font-bold mb-8'>
        Settings
      </Text>

      <View className='my-auto'>
        <AppDropdown
          label='Select Language'
          options={LANGUAGES}
          value={selectedLanguage}
          onChange={onLanguageChange}
        />

        <AppDropdown
          label='Select Difficulty Level'
          options={DIFFICULTY_LEVELS}
          value={difficulty}
          onChange={onDifficultyChange}
        />
      </View>

      <AppLinkAsButton href={ROUTES.home} className='text-lg w-full mt-auto'>
        <Text className='text-center text-white'>Save Settings</Text>
      </AppLinkAsButton>
    </View>
  )
}

export default Settings
