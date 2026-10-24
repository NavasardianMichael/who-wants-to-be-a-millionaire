'use client'

import { useEffect } from 'react'
import { useGameSessionStore } from '@store/game/session/store'
import { audioManager } from '@helpers/audio/audioManager'

/**
 * The show's main theme under every page outside a game: the home page, the rules, the
 * setup screen, the result screen. A game takes the music over from its start sting on
 * (`startGame` stops everything), and leaving it hands the theme back.
 */
export const AmbientMusic = () => {
  const phase = useGameSessionStore.use.phase()
  const offStage = phase === 'idle' || phase === 'ended'

  useEffect(() => {
    if (offStage) audioManager.playMusic('mainTheme')
  }, [offStage])

  return null
}
