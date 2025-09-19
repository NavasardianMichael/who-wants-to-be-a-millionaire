import { getQuiz } from '@/api/getQuiz'
import { ICONS } from '@/constants/icons'
import { LANGUAGE_NAMES } from '@/constants/settings'
import { LANGUAGES_LIST } from '@/services/translations/constants'
import { useSettingsStore } from '@/store/settings/store'
import { Language } from '@/types/settings'
import { ReactNode, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Pressable, ScrollView, Text, View } from 'react-native'

export type AppDropdownOption = {
  label: ReactNode
  value: string
}

export default function LanguagesDropdown() {
  const { language, setSettingsState } = useSettingsStore()
  const {
    i18n: { changeLanguage },
  } = useTranslation()

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const selectLanguage = useCallback(
    (selectedValue: Language) => {
      setSettingsState({ language: selectedValue })
      changeLanguage(selectedValue)
      setIsDropdownOpen(false)
      getQuiz({ language: selectedValue })
    },
    [setSettingsState, changeLanguage]
  )

  const SelectedLangIcon = ICONS[language]

  return (
    <View className={`relative!`}>
      <Pressable
        accessibilityIgnoresInvertColors
        onPress={toggleDropdown}
        className={`bg-primary w-140  border border-secondary rounded-lg py-sm px-md flex-row justify-between items-center ${isDropdownOpen && 'rounded-b-none'} h-9`}
      >
        <View className={`flex-row items-center `}>
          <View className='flex flex-row items-center gap-sm h-8'>
            <SelectedLangIcon className='h-full border border-primary' />
            <Text className='text-secondary'>{LANGUAGE_NAMES[language]}</Text>
          </View>
        </View>
        <Text className={`text-secondary text-xs transition ml-sm rotate-180`}>
          {'▼'}
        </Text>
        {/* Dropdown List */}
      </Pressable>
      {isDropdownOpen && (
        <View className='absolute left-0 right-0 top-9 bg-primary border border-t-0  border-secondary rounded-b-lg overflow-hidden'>
          <ScrollView>
            {LANGUAGES_LIST.map((l, index, arr) => {
              const Icon = ICONS[l]
              return (
                <Pressable
                  key={l}
                  onPress={() => selectLanguage(l)}
                  className={`py-sm px-md flex-row items-center ${index + 1 !== arr.length && 'border-b border-primary'}  ${
                    language === l ? 'bg-blue-100' : 'bg-secondary'
                  }`}
                >
                  <View className='flex flex-row items-center gap-sm h-8'>
                    <Icon className='h-full border border-primary' />
                    <Text>{LANGUAGE_NAMES[l]}</Text>
                  </View>
                </Pressable>
              )
            })}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
