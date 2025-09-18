import { SOUNDS_IDS_BY_SAFE_HAVEN } from '@/constants/sound'

export const getBgSoundIdByQuestionStage = (stage: number) => {
  return SOUNDS_IDS_BY_SAFE_HAVEN[Math.floor(stage / 5)]
}
