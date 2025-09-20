import { ICONS } from '@/constants/icons';
import { useGameStore } from '@/store/game/store';
import { Pressable, TouchableOpacity, View } from 'react-native';

export default function SidebarTrigger() {
  const { isSidebarOpen, setIsSidebarOpen, toggleIsSidebarOpen } =
    useGameStore();

  return (
    <>
      <View className={`absolute top-0 right-0 z-20`}>
        <TouchableOpacity
          className={`w-6 h-6 z-20 m-lg ${isSidebarOpen ? 'rotate-180' : ''}`}
          onPress={() => toggleIsSidebarOpen}
        >
          <ICONS.sidebar />
        </TouchableOpacity>
        {isSidebarOpen && (
          <Pressable onPress={() => setIsSidebarOpen(false)}>
            <View className="ml-auto bg-primary opacity-80" />
          </Pressable>
        )}
      </View>
    </>
  );
}
