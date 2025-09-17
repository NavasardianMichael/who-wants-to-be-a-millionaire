import { getQuiz } from '@/api/getQuiz'
import { useSettingsStore } from '@/store/settings/store'
import { Language } from '@/types/settings'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native'
import { AppDropdownOption } from '../ui/AppDropdown'
import { LANGUAGE_DROPDOWN_OPTIONS } from './languageDropdownTemplate'

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
    (selectedValue: AppDropdownOption) => {
      const language = selectedValue.value as Language
      setSettingsState({ language })
      changeLanguage(language)
      setIsDropdownOpen(false)
      getQuiz({ language })
    },
    [setSettingsState, changeLanguage]
  )

  const selectedLanguageLabel = useMemo(() => {
    return LANGUAGE_DROPDOWN_OPTIONS.find((opt) => opt.value === language)
      ?.label
  }, [language])

  return (
    <View className={`relative!`}>
      <Pressable
        accessibilityIgnoresInvertColors
        onPress={toggleDropdown}
        className={`bg-primary w-[140px]  border border-secondary rounded-lg py-sm px-md flex-row justify-between items-center ${isDropdownOpen && 'rounded-b-none'} h-[36px]`}
      >
        <View className={`flex-row items-center `}>
          <Text className='text-secondary'>{selectedLanguageLabel}</Text>
        </View>
        <Text
          className={`text-secondary text-xs transition ml-sm ${isDropdownOpen ? 'rotate-180' : undefined}`}
        >
          {'▼'}
        </Text>
        {/* Dropdown List */}
      </Pressable>
      {isDropdownOpen && (
        <View className='absolute left-0 right-0 top-[36px] bg-primary text-secondary border border-t-0  border-secondary rounded-b-lg overflow-hidden'>
          <ScrollView>
            {LANGUAGE_DROPDOWN_OPTIONS.map((option, index, arr) => (
              <Pressable
                key={option.value}
                onPress={() => selectLanguage(option)}
                className={`py-sm px-md flex-row items-center ${index + 1 !== arr.length && 'border-b border-primary'}  ${language === option.value ? 'bg-blue-100' : 'bg-secondary'
                  }`}
              >
                <Text className='color-primary'>{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
