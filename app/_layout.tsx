import { Stack } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import './globals.css'

export default function RootLayout() {
  return (
    <SafeAreaView className='flex-1 bg-primary border-none'>
      <Stack
        screenOptions={{ headerShown: false }}
        layout={({ children }) => (
          <View className='bg-primary p-4 flex-1'>{children}</View>
        )}
      />
    </SafeAreaView>
  )
}
