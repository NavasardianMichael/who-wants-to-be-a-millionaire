import { useClassNameByOrientation } from '@/hooks/useClassNameByOrientation'
import React, { FC, useCallback, useState } from 'react'
import {
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type Props = {
  label: string
  options: string[]
  value: string
  onChange: (value: string) => void
  className?: string
}

const AppDropdown: FC<Props> = ({ label, options, value, className, onChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const classNameByOrientation = useClassNameByOrientation('mb-md', 'mb-sm')

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const selectLanguage = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue)
      setIsDropdownOpen(false)
    },
    [onChange]
  )

  return (
    <View className={`relative ${className} ${classNameByOrientation}`}>
      <Text className='text-secondary font-bold mb-3'>{label}</Text>

      {/* Dropdown Button */}
      <Pressable
        accessibilityIgnoresInvertColors
        onPress={toggleDropdown}
        className={`bg-primary  border border-secondary rounded-lg py-sm px-md flex-row justify-between items-center ${isDropdownOpen && 'rounded-b-none'}`}
      >
        <View className='flex-row items-center'>
          <Text className='text-secondary'>{value}</Text>
        </View>
        <Text
          className={`text-secondary text-xs transition-transform ${isDropdownOpen && 'rotate-180'}`}
        >
          {'▼'}
        </Text>
        {/* Dropdown List */}
      </Pressable>
      {isDropdownOpen && (
        <View className='absolute left-0 right-0 top-[68px] bg-primary text-secondary border border-t-0 border-secondary rounded-b-lg max-h-80 overflow-hidden'>
          <ScrollView className='max-h-80'>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => selectLanguage(option)}
                className={`py-sm px-md flex-row items-center border-b border-primary ${value === option ? 'bg-blue-100' : 'bg-secondary'
                  }`}
              >
                <Text className='color-primary'>{option}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

export default AppDropdown
