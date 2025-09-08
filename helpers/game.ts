import { OPTIONS_SERIAL_NUMBERS } from '@/constants/game'
import { SOUNDS_IDS_BY_SAFE_HAVEN } from '@/constants/sound'
import { OptionSerialNumber } from '@/types/game'

export const sliceArrayContainingCorrectAnswer = (
  correctAnswerSerialNumber: OptionSerialNumber
) => {
  const incorrectOptions = OPTIONS_SERIAL_NUMBERS.filter(
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
  correctAnswerSerialNumber: OptionSerialNumber,
  guaranteedProbability: number
): OptionSerialNumber => {
  const randomValue = Math.random() * 100
  return randomValue <= guaranteedProbability
    ? correctAnswerSerialNumber
    : (Math.ceil(Math.random() * 4) as OptionSerialNumber)
}

export const getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer = (
  correctAnswerSerialNumber: OptionSerialNumber,
  guaranteedProbability: number
): Record<OptionSerialNumber, number> => {
  const correctAnswerGuaranteedProbability = Math.max(Math.round(Math.random() * 100), 40)

  const probabilities = {
    [correctAnswerSerialNumber]: correctAnswerGuaranteedProbability,
  } as Record<OptionSerialNumber, number>
  console.log({ correctAnswerGuaranteedProbability });

  let remainingProbability = 100 - correctAnswerGuaranteedProbability

  OPTIONS_SERIAL_NUMBERS.forEach((option, i, arr) => {
    const serialNumber = option as OptionSerialNumber
    if (probabilities[serialNumber]) return
    const optionProbability = Math.floor(Math.random() * remainingProbability)
    probabilities[serialNumber] = optionProbability
    if (arr.length - 1 === i) {
      probabilities[serialNumber] = remainingProbability
      return
    }
    remainingProbability -= optionProbability
  })
  return probabilities
}

export const getBgSoundIdByQuestionStage = (stage: number) => {
  return SOUNDS_IDS_BY_SAFE_HAVEN[Math.floor(stage / 5)]
}
