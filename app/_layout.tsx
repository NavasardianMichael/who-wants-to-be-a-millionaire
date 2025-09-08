import Header from '@/components/header/Header'
import { Stack } from 'expo-router'
import { View } from 'react-native'
import '../styles/globals.css'

export default function RootLayout() {
  return (
    <View className='flex-1'>
      <Stack
        screenOptions={{ headerShown: false }}
        layout={({ children }) => (
          <View className='flex-1 flex p-lg bg-primary'>
            <Header />
            <View className='bg-primary flex-1'>{children}</View>
          </View>
        )}
      />
    </View>
  )
}
