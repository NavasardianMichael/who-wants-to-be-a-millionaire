import { Link } from 'expo-router'
import { Text, View } from 'react-native'

const App = () => {
  return (
    <View className='flex-1 p-4 bg-primary'>
      <Text className='text-3xl text-center text-white font-bold'>
        Who Wants to Be a Millionaire!!!
      </Text>
      <Link href='/onboarding'>Onboarding</Link>
    </View>
  )
}

export default App
