import Header from '@/components/header/Header';
import { OPTIONS_SERIAL_NUMBERS } from '@/constants/game';
import { useFetchQuizItem } from '@/hooks/useFetchQuizItem';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import '../styles/globals.css';

export default function RootLayout() {
  const fetchQuizItem = useFetchQuizItem();

  useEffect(() => {
    console.log(468);

    fetchQuizItem(OPTIONS_SERIAL_NUMBERS[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useFetchQuizItem]);

  return (
    <View className='flex-1'>
      <Stack
        screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#002876' } }}
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
