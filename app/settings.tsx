import React, { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese (Simplified)', flag: '🇨🇳' },
    { code: 'zh-tw', name: 'Chinese (Traditional)', flag: '🇹🇼' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'th', name: 'Thai', flag: '🇹🇭' },
    { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
    { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
    { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
    { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
    { code: 'no', name: 'Norwegian', flag: '🇳🇴' },
    { code: 'da', name: 'Danish', flag: '🇩🇰' },
    { code: 'fi', name: 'Finnish', flag: '🇫🇮' },
    { code: 'pl', name: 'Polish', flag: '🇵🇱' },
    { code: 'cs', name: 'Czech', flag: '🇨🇿' },
    { code: 'sk', name: 'Slovak', flag: '🇸🇰' },
    { code: 'hu', name: 'Hungarian', flag: '🇭🇺' },
    { code: 'ro', name: 'Romanian', flag: '🇷🇴' },
    { code: 'bg', name: 'Bulgarian', flag: '🇧🇬' },
    { code: 'hr', name: 'Croatian', flag: '🇭🇷' },
    { code: 'sr', name: 'Serbian', flag: '🇷🇸' },
    { code: 'sl', name: 'Slovenian', flag: '🇸🇮' },
    { code: 'et', name: 'Estonian', flag: '🇪🇪' },
    { code: 'lv', name: 'Latvian', flag: '🇱🇻' },
    { code: 'lt', name: 'Lithuanian', flag: '🇱🇹' },
    { code: 'el', name: 'Greek', flag: '🇬🇷' },
    { code: 'he', name: 'Hebrew', flag: '🇮🇱' },
    { code: 'fa', name: 'Persian', flag: '🇮🇷' },
    { code: 'ur', name: 'Urdu', flag: '🇵🇰' },
    { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
    { code: 'ta', name: 'Tamil', flag: '🇱🇰' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'kn', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ml', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'si', name: 'Sinhala', flag: '🇱🇰' },
    { code: 'my', name: 'Myanmar', flag: '🇲🇲' },
    { code: 'km', name: 'Khmer', flag: '🇰🇭' },
    { code: 'lo', name: 'Lao', flag: '🇱🇦' },
    { code: 'ka', name: 'Georgian', flag: '🇬🇪' },
    { code: 'hy', name: 'Armenian', flag: '🇦🇲' },
    { code: 'az', name: 'Azerbaijani', flag: '🇦🇿' },
    { code: 'kk', name: 'Kazakh', flag: '🇰🇿' },
    { code: 'ky', name: 'Kyrgyz', flag: '🇰🇬' },
    { code: 'uz', name: 'Uzbek', flag: '🇺🇿' },
    { code: 'tg', name: 'Tajik', flag: '🇹🇯' },
    { code: 'mn', name: 'Mongolian', flag: '🇲🇳' },
    { code: 'ne', name: 'Nepali', flag: '🇳🇵' },
    { code: 'ps', name: 'Pashto', flag: '🇦🇫' },
    { code: 'sd', name: 'Sindhi', flag: '🇵🇰' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'ig', name: 'Igbo', flag: '🇳🇬' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'id', name: 'Indonesian', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', flag: '🇲🇾' },
    { code: 'tl', name: 'Filipino', flag: '🇵🇭' },
]

const Settings = () => {
    const [selectedLanguage, setSelectedLanguage] = useState(languages[0])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen)
    }

    const selectLanguage = (language: typeof languages[0]) => {
        setSelectedLanguage(language)
        setIsDropdownOpen(false)
    }

    return (
        <View className='flex-1 bg-primary p-6'>
            <Text className='text-3xl text-center text-white font-bold mb-8'>Settings</Text>

            <View className='mb-6'>
                <Text className='text-white text-lg font-semibold mb-3'>Select Language</Text>

                {/* Dropdown Button */}
                <TouchableOpacity
                    onPress={toggleDropdown}
                    className='bg-white border-2 border-gray-300 rounded-lg p-4 flex-row justify-between items-center'
                >
                    <View className='flex-row items-center'>
                        <Text className='text-2xl mr-3'>{selectedLanguage.flag}</Text>
                        <Text className='text-gray-800 text-lg font-medium'>{selectedLanguage.name}</Text>
                    </View>
                    <Text className='text-gray-600 text-xl'>{isDropdownOpen ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {/* Dropdown List */}
                {isDropdownOpen && (
                    <View className='bg-white border-2 border-t-0 border-gray-300 rounded-b-lg max-h-60 overflow-hidden'>
                        <ScrollView className='max-h-60'>
                            {languages.map((language) => (
                                <TouchableOpacity
                                    key={language.code}
                                    onPress={() => selectLanguage(language)}
                                    className={`p-4 flex-row items-center border-b border-gray-200 ${selectedLanguage.code === language.code ? 'bg-blue-50' : 'bg-white'
                                        }`}
                                >
                                    <Text className='text-2xl mr-3'>{language.flag}</Text>
                                    <Text className={`text-lg ${selectedLanguage.code === language.code
                                            ? 'text-blue-600 font-semibold'
                                            : 'text-gray-800'
                                        }`}>
                                        {language.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    )
}

export default Settings
