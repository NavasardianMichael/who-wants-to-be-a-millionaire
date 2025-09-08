import { SOUNDS_IDS_BY_SAFE_HAVEN } from '@/constants/sound'
import { AnswerOptionSerialNumber } from '@/types/game'

export const sliceArrayContainingCorrectAnswer = (
  correctAnswerSerialNumber: AnswerOptionSerialNumber
) => {
  const allOptions = [1, 2, 3, 4] as AnswerOptionSerialNumber[]
  const incorrectOptions = allOptions.filter(
    (option) => option !== correctAnswerSerialNumber
  )
  const randomOptionSerialNumberToPairWithCorrect =
    incorrectOptions[Math.floor(Math.random() * incorrectOptions.length)]
  const randomIncorrectOptions = incorrectOptions.filter(
    (option) => option !== randomOptionSerialNumberToPairWithCorrect
  )

  return {
    [randomIncorrectOptions[0]]: true,
    [randomIncorrectOptions[1]]: true,
  }
}

export const getAnswerWithGuaranteedProbability = (
  correctAnswerSerialNumber: AnswerOptionSerialNumber,
  guaranteedProbability: number
): AnswerOptionSerialNumber => {
  const randomValue = Math.random() * 100
  return randomValue <= guaranteedProbability
    ? correctAnswerSerialNumber
    : (Math.ceil(Math.random() * 4) as AnswerOptionSerialNumber)
}

export const getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer = (
  correctAnswerSerialNumber: AnswerOptionSerialNumber,
  guaranteedProbability: number
): Record<AnswerOptionSerialNumber, number> => {
  const correctAnswerGuaranteedProbability = getAnswerWithGuaranteedProbability(
    correctAnswerSerialNumber,
    guaranteedProbability
  )
  const probabilities = {
    [correctAnswerSerialNumber]: correctAnswerGuaranteedProbability,
  } as Record<AnswerOptionSerialNumber, number>

  let remainingProbability = 100 - correctAnswerGuaranteedProbability
  new Array(4).fill(null).forEach((_, index, arr) => {
    const serialNumber = (index + 1) as AnswerOptionSerialNumber
    if (probabilities[serialNumber]) return
    const optionProbability = Math.floor(Math.random() * remainingProbability)
    probabilities[serialNumber] = optionProbability
    remainingProbability -= probabilities[serialNumber]
  })
  return probabilities
}

export const getBgSoundIdByQuestionStage = (stage: number) => {
  return SOUNDS_IDS_BY_SAFE_HAVEN[Math.floor(stage / 5)]
}
