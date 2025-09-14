import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import React, { FC, ReactNode, useCallback, useMemo, useState } from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

export type AppDropdownOption = {
  label: ReactNode
  value: string
}

type Props = {
  label?: ReactNode
  options: AppDropdownOption[]
  value: AppDropdownOption['value']
  onChange: (value: AppDropdownOption) => void
  className?: string
  itemClassName?: string
}

const AppDropdown: FC<Props> = ({
  label,
  options,
  value,
  className,
  itemClassName,
  onChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const classNameByOrientation = useClassNameByOrientation('mb-md', 'mb-sm')

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const selectLanguage = useCallback(
    (selectedValue: AppDropdownOption) => {
      onChange(selectedValue)
      setIsDropdownOpen(false)
    },
    [onChange]
  )

  const selectedLanguageLabel = useMemo(() => {
    return options.find((opt) => opt.value === value)?.label
  }, [options, value])

  return (
    <View className={`relative ${className} ${classNameByOrientation}`}>
      {label && <Text className='text-secondary font-bold mb-sm'>{label}</Text>}

      {/* Dropdown Button */}
      <Pressable
        accessibilityIgnoresInvertColors
        onPress={toggleDropdown}
        className={`bg-primary  border border-secondary rounded-lg py-sm px-md flex-row justify-between items-center ${isDropdownOpen && 'rounded-b-none'}`}
      >
        <View className={`flex-row items-center ${itemClassName}`}>
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
            {options.map((option, index, arr) => (
              <TouchableOpacity
                key={option.value}
                onPress={() => selectLanguage(option)}
                className={`py-sm px-md flex-row items-center ${index + 1 !== arr.length && 'border-b border-primary'} ${
                  value === option.value ? 'bg-blue-100' : 'bg-secondary'
                } ${itemClassName}`}
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

export default AppDropdown
