import { OPTIONS_SERIAL_NUMBERS, QUESTION_STAGES } from '@/constants/game'
import { LifelinesState } from '@/store/lifelines/types'
import { OptionSerialNumber, QuestionStage } from '@/types/game'

export const getGuaranteedProbabilityByStage = (
  stage: QuestionStage,
  probabilityForMistake: number = 20
) => {
  return Math.floor(
    100 - probabilityForMistake - (stage / QUESTION_STAGES.length) * 100
  )
}

export const getIncorrectOptionsSerialNumbersList = (
  fiftyFifty: LifelinesState['fiftyFifty']
) => {
  return fiftyFifty
    ? (Object.keys(fiftyFifty).map(
        (v) => +v
      ) as unknown as OptionSerialNumber[])
    : []
}

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
  guaranteedProbability: number,
  excludedOptions: OptionSerialNumber[] = []
): OptionSerialNumber => {
  const randomValue = Math.random() * 100
  const value =
    randomValue <= guaranteedProbability
      ? correctAnswerSerialNumber
      : (Math.ceil(Math.random() * 4) as OptionSerialNumber)

  if (excludedOptions.includes(value)) {
    return getAnswerWithGuaranteedProbability(
      correctAnswerSerialNumber,
      guaranteedProbability,
      excludedOptions
    )
  }
  return value
}

export const getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer = (
  correctAnswerSerialNumber: OptionSerialNumber,
  guaranteedProbability: number,
  excludedOptions: OptionSerialNumber[] = []
): Record<OptionSerialNumber, number> => {
  const correctAnswerGuaranteedProbability = Math.max(
    Math.round(Math.random() * 100),
    guaranteedProbability
  )

  const probabilities = {
    [correctAnswerSerialNumber]: correctAnswerGuaranteedProbability,
  } as Record<OptionSerialNumber, number>

  let remainingProbability = 100 - correctAnswerGuaranteedProbability

  if (excludedOptions.length) {
    const notExcludedIncorrectOptionSerialNumber = OPTIONS_SERIAL_NUMBERS.find(
      (number) =>
        number !== correctAnswerSerialNumber &&
        !excludedOptions.includes(number)
    )
    probabilities[notExcludedIncorrectOptionSerialNumber!] =
      remainingProbability
    return probabilities
  }

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
