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
}

const Dropdown: FC<Props> = ({ label, options, value, onChange }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
    <View className='mb-6'>
      <Text className='text-white text-lg font-bold mb-3'>{label}</Text>

      {/* Dropdown Button */}
      <Pressable
        accessibilityIgnoresInvertColors
        onPress={toggleDropdown}
        className={`bg-white border-2 border-gray-300 rounded-lg p-4 flex-row justify-between items-center ${isDropdownOpen && 'rounded-b-none'}`}
      >
        <View className='flex-row items-center'>{value}</View>
        <Text
          className={`text-gray-600 transition-transform ${isDropdownOpen && 'rotate-180'}`}
        >
          {'▼'}
        </Text>
      </Pressable>

      {/* Dropdown List */}
      {isDropdownOpen && (
        <View className='bg-white border-2 border-t-0 border-gray-300 rounded-b-lg max-h-80 overflow-hidden'>
          <ScrollView className='max-h-80'>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => selectLanguage(option)}
                className={`p-4 flex-row items-center border-b border-gray-200 ${
                  value === option ? 'bg-blue-50' : 'bg-white'
                }`}
              >
                {option}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  )
}

export default Dropdown
