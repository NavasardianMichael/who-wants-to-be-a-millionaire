import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { ROUTES } from './constants/routes';
import './globals.css';

export default function Index() {
  return (
    <View className='flex-1 bg-primary'>
      <Text className='text-2xl text-center text-white font-bold'>
        Who Wants to Be a Millionaire
      </Text>
      <View className='flex flex-1 justify-center items-center gap-4'>
        <Link href={ROUTES.startGame} className='w-60 bg-primary py-4 px-8 text-center rounded-md text-secondary border border-secondary'>Start Game</Link>
        <Link href={ROUTES.settings} className='w-60 bg-primary py-4 px-8 text-center rounded-md text-secondary border border-secondary'>Settings</Link>
      </View>
    </View>
  )
}
