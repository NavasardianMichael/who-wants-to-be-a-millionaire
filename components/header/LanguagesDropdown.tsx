import { getQuiz } from '@/api/getQuiz'
import { useSettingsStore } from '@/store/settings/store'
import { Language } from '@/types/settings'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { AppDropdownOption } from '../ui/AppDropdown'

export default function LanguagesDropdown() {
  const { language, setSettingsState } = useSettingsStore()
  const {
    i18n: { changeLanguage },
  } = useTranslation()

  const languageOptions = useMemo(() => {
    return [
      {
        label: (
          <View className='flex flex-row items-center gap-sm h-full'>
            <Image
              source={require('../../assets/icons/en.svg')}
              className='h-full'
            />
            <Text>English</Text>
          </View>
        ),
        value: 'en',
      },
      {
        label: (
          <View className='flex flex-row items-center gap-sm h-full'>
            <Image
              source={require('../../assets/icons/ru.svg')}
              className='h-full'
            />
            <Text>Russian</Text>
          </View>
        ),
        value: 'ru',
      },
      {
        label: (
          <View className='flex flex-row items-center gap-sm h-full'>
            <Image
              source={require('../../assets/icons/am.svg')}
              className='h-full'
            />
            <Text>Armenian</Text>
          </View>
        ),
        value: 'am',
      },
    ]
  }, [])

  //   className='h-[24px] z-10'
  // options={languageOptions}
  // value={language}
  // itemClassName='h-[24px]'
  // onChange={(option) => {
  //   setSettingsState({ language: option.value as Language })
  //   changeLanguage(option.value)
  // }}

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
    return languageOptions.find((opt) => opt.value === language)?.label
  }, [languageOptions, language])

  return (
    <View className={`relative!`}>
      <Pressable
        accessibilityIgnoresInvertColors
        onPress={toggleDropdown}
        className={`bg-primary  border border-secondary rounded-lg py-sm px-md flex-row justify-between items-center ${isDropdownOpen && 'rounded-b-none'} box-border h-[36px]`}
      >
        <View className={`flex-row items-center `}>
          <Text className='text-secondary'>{selectedLanguageLabel}</Text>
        </View>
        <Text
          className={`text-secondary text-xs transition ${isDropdownOpen && 'rotate-180'}`}
        >
          {'▼'}
        </Text>
        {/* Dropdown List */}
      </Pressable>
      {isDropdownOpen && (
        <View className='absolute left-0 right-0 top-[64px] bg-primary text-secondary border border-t-0  border-secondary rounded-b-lg max-h-[200px] overflow-hidden'>
          <ScrollView className='max-h-80'>
            {languageOptions.map((option, index, arr) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => selectLanguage(option)}
                className={`py-sm px-md flex-row items-center ${index + 1 !== arr.length && 'border-b border-primary'} box-border ${
                  language === option.value ? 'bg-blue-100' : 'bg-secondary'
                }`}
              >
                <Text className='color-primary'>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}
