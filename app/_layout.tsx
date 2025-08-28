import Header from '@/components/Header'
import { Stack } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import '../styles/globals.css'

export default function RootLayout() {
  return (
    <SafeAreaView className='flex-1'>
      <Stack
        screenOptions={{ headerShown: false }}
        layout={({ children }) => (
          <View className='flex-1 flex p-lg bg-primary'>
            <Header />
            <View className='bg-primary flex-1'>
              {children}
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  )
}
