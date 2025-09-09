import AppDropdown from '@/components/ui/AppDropdown'
import AppLinkAsButton from '@/components/ui/AppLinkAsButton'
import { ROUTES } from '@/constants/routes'
import { DIFFICULTY_LEVELS, LANGUAGES } from '@/constants/settings'
import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import { Difficulty, Language } from '@/types/settings'

import React, { useCallback, useState } from 'react'
import { View } from 'react-native'

const Settings = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(
    LANGUAGES[1]
  )
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTY_LEVELS[2])

  const containerClassName = useClassNameByOrientation('p-md', 'p-sm')

  const onLanguageChange = useCallback((value: Language) => {
    setSelectedLanguage(value)
  }, [])

  const onDifficultyChange = useCallback((value: Difficulty) => {
    setDifficulty(value)
  }, [])

  return (
    <View className={`flex-1 bg-primary ${containerClassName}`}>
      <View className='flex-col gap-sm mt-lg'>
        <AppDropdown
          label='Select Language'
          className='z-10'
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

      <AppLinkAsButton href={ROUTES.home} className='w-full mt-auto'>
        Save Settings
      </AppLinkAsButton>
    </View>
  )
}

export default Settings
