import Header from '@/components/header/Header';
import { useGameStore } from '@/store/game/store';
import { useSettingsStore } from '@/store/settings/store';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import '../styles/globals.css';

import { SOUNDS_URIS } from '@/constants/sound';
import { useSound } from '@/hooks/useSound';
import '../services/translations/i18n';

export default function RootLayout() {
  const { language } = useSettingsStore();
  const { initQuiz } = useGameStore();
  useSound(SOUNDS_URIS.mainTheme, { loop: true });
  useSound(SOUNDS_URIS.resign);

  useEffect(() => {
    initQuiz({ language });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);
  const screenOptions = {
    headerShown: false,
    statusBarHidden: true,
    contentStyle: { backgroundColor: '#002876' },
  };

  return (
    <Stack
      screenOptions={screenOptions}
      layout={({ children }) => (
        <View className="flex-1 flex p-lg bg-primary">
          <Header />
          <View className="bg-primary flex-1">{children}</View>
        </View>
      )}
    />
  );
}
