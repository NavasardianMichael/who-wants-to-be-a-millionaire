import { AnswerOptionSerialNumber } from '@/types/game';

export const getAnswerWithGuaranteedProbability = (correctAnswerSerialNumber: AnswerOptionSerialNumber, guaranteedProbability: number): AnswerOptionSerialNumber => {
    const randomValue = Math.random() * 100
    return randomValue <= guaranteedProbability ? correctAnswerSerialNumber : Math.ceil(Math.random() * 4) as AnswerOptionSerialNumber
}

export const getProbabilitiesWithGuaranteedProbabilityForCorrectAnswer = (correctAnswerSerialNumber: AnswerOptionSerialNumber, guaranteedProbability: number): Record<AnswerOptionSerialNumber, number> => {
    const correctAnswerGuaranteedProbability = getAnswerWithGuaranteedProbability(correctAnswerSerialNumber, guaranteedProbability)
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