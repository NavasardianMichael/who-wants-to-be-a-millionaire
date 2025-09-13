import AppDropdown, { AppDropdownOption } from '@/components/ui/AppDropdown'
import AppLinkAsButton from '@/components/ui/AppLinkAsButton'
import { ROUTES } from '@/constants/routes'
import { DIFFICULTY_LEVELS, LANGUAGE_NAMES } from '@/constants/settings'
import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import { useSettingsStore } from '@/store/settings/store'
import { Difficulty, Language } from '@/types/settings'

import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { View } from 'react-native'

const Settings = () => {
  const { language, difficulty, setSettingsState } = useSettingsStore()
  const {
    i18n: { changeLanguage },
  } = useTranslation()
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(language)
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<Difficulty>(difficulty)

  const containerClassName = useClassNameByOrientation('p-md', 'p-sm')

  const onLanguageChange = useCallback(
    (option: AppDropdownOption) => {
      setSelectedLanguage(option.value as Language)
      changeLanguage(option.value)
    },
    [changeLanguage]
  )

  const onDifficultyChange = useCallback((option: AppDropdownOption) => {
    setSelectedDifficulty(option.value as Difficulty)
  }, [])

  const languageOptions = useMemo(() => {
    return Object.entries(LANGUAGE_NAMES).map(([value, label]) => ({
      label,
      value,
    }))
  }, [])

  const difficultyOptions = useMemo(() => {
    return Object.entries(DIFFICULTY_LEVELS).map(([value, label]) => ({
      label,
      value,
    }))
  }, [])

  return (
    <View className={`flex-1 bg-primary ${containerClassName}`}>
      <View className='flex-col gap-sm mt-lg'>
        <AppDropdown
          label='Select Language'
          className='z-10'
          options={languageOptions}
          value={selectedLanguage}
          onChange={onLanguageChange}
        />

        <AppDropdown
          label='Select Difficulty Level'
          options={difficultyOptions}
          value={selectedDifficulty}
          onChange={onDifficultyChange}
        />
      </View>

      <AppLinkAsButton
        href={ROUTES.home}
        className='w-full mt-auto'
        onPress={() =>
          setSettingsState({
            language: selectedLanguage,
            difficulty: selectedDifficulty,
          })
        }
      >
        Save Settings
      </AppLinkAsButton>
    </View>
  )
}

export default Settings
