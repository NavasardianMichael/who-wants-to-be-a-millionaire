/**
 * Custom React hook for managing sound playback using Expo's Audio API.
 *
 * @param uri - The URI of the audio file to play.
 * @returns An object containing playback controls and state:
 * - `play`: Function to play the sound.
 * - `pause`: Function to pause the sound.
 * - `stop`: Function to stop the sound.
 * - `toggleMute`: Function to toggle mute state.
 * - `isPlaying`: Boolean indicating if the sound is currently playing.
 * - `isMuted`: Boolean indicating if the sound is currently muted.
 *
 * @remarks
 * - Automatically unloads the sound when the component unmounts.
 * - Handles loading, playing, pausing, stopping, and muting of the sound.
 * - Uses Expo's `Audio.Sound` and React hooks for state management.
 */
import { useGameStore } from '@/store/game/store';
import { useMemo } from 'react';
import { useSound } from './useSound';


export function useStoredSound(uri: string) {
    const { setCurrentSound } = useGameStore()
    const api = useSound(uri)
    return useMemo(() => {
        return {
            ...api,
            play: async () => {
                await api.play()
                setCurrentSound(api)
            }
        }
    }, [api, setCurrentSound])
}