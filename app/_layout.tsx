import { Stack } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function RootLayout() {
  return (
    <SafeAreaView className='flex-1 bg-primary'>
      <Stack
        screenOptions={{ headerShown: false }}
        layout={({ children }) => (
          <View className='flex-1 p-4 bg-primary'>{children}</View>
        )}
      />
    </SafeAreaView>
  )
}
