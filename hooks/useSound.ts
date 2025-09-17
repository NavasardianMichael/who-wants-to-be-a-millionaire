import { useSoundStore } from "@/store/sound/store";
import { SoundAPI } from "@/store/sound/types";
import { useAudioPlayer } from "expo-audio";
import { useEffect, useMemo } from "react";

type UseSound = (
  uri: string,
  options?: { loop?: boolean; playOnInit?: boolean }
) => SoundAPI;

export const useSound: UseSound = (uri, options) => {
  const soundStore = useSoundStore();
  const { loop = false } = options || {};
  const audioPlayer = useAudioPlayer(uri);

  const api: SoundAPI = useMemo(() => {
    const id = uri;
    const existingSound = soundStore.soundAPIById[id];
    if (existingSound) return existingSound;

    const result: SoundAPI = {
      id,
      play: async () => {
        audioPlayer.seekTo(0);
        audioPlayer.loop = loop;
        audioPlayer.muted = soundStore.isMuted;
        audioPlayer.play();
        soundStore.setSoundState({
          activeSoundIdsStack: [...soundStore.activeSoundIdsStack, id],
        });
      },
      pause: async () => {
        audioPlayer.pause();
      },
      stop: async () => {
        audioPlayer.pause();
      },
      setMutedStatus: async (isMuted: boolean) => {
        audioPlayer.muted = isMuted;
        soundStore.setSoundState({ isMuted });
      },
    };
    return result;
  }, [uri, soundStore, audioPlayer, loop]);

  useEffect(() => {
    const fn = () => {
      if (soundStore.soundAPIById[uri]) return;
      soundStore.setSoundState({
        soundAPIById: { ...soundStore.soundAPIById, [uri]: api },
      });
    };
    fn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, uri]);

  useEffect(() => {
    const initSound = async () => {
      if (soundStore.soundAPIById[uri]) return;
      soundStore.setSoundState({
        soundAPIById: { ...soundStore.soundAPIById, [uri]: api },
      });
    };
    initSound();
  }, [api, soundStore, uri]);

  return api;
};
