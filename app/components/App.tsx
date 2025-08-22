import { Link } from 'expo-router'
import { Text, View } from 'react-native'
import Orientation from 'react-native-orientation-locker'
import { ROUTES } from '../constants/routes'

Orientation.lockToLandscape()

const App = () => {
  return (
    <View>
      <Text className='text-3xl text-center text-white font-bold'>
        Who Wants to Be a Millionaire!!!
      </Text>
      <Link href={ROUTES.onboarding}>Onboarding</Link>
    </View>
  )
}

export default App
