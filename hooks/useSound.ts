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
import { Audio, AVPlaybackStatus } from "expo-av";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";


export function useSound(uri: string) {
    const { currentSound } = useGameStore()
    const sound = useRef<Audio.Sound | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isMuted, setIsMuted] = useState(false)

    useEffect(() => {
        return () => {
            // Unload sound when component unmounts
            if (sound.current) {
                sound.current.unloadAsync()
            }
        }
    }, [])

    const updateStatus = useCallback((status: AVPlaybackStatus) => {
        if (!status.isLoaded) return
        setIsPlaying(status.isPlaying)
    }, [])

    const loadSound = useCallback(async () => {
        if (!sound.current) {
            const { sound: newSound } = await Audio.Sound.createAsync(
                { uri },
                { shouldPlay: false, isMuted }
            )
            sound.current = newSound
            sound.current.setOnPlaybackStatusUpdate(updateStatus)
        }
    }, [uri, isMuted, updateStatus])

    const play = useCallback(async () => {
        await currentSound?.stop()
        await loadSound()
        await sound.current?.playAsync()
    }, [currentSound, loadSound])

    const pause = useCallback(async () => {
        await sound.current?.pauseAsync()
    }, [])

    const stop = useCallback(async () => {
        await sound.current?.stopAsync()
    }, [])

    const toggleMute = useCallback(async () => {
        const newMuted = !isMuted
        setIsMuted(newMuted)
        await sound.current?.setIsMutedAsync(newMuted)
    }, [isMuted])

    const api = useMemo(() => ({
        play,
        pause,
        stop,
        toggleMute,
        isPlaying,
        isMuted
    }), [play, pause, stop, toggleMute, isPlaying, isMuted])

    return api
}