import { QUESTION_STAGES } from "@/constants/game";
import { useGameStore } from "@/store/game/store";
import { GameState } from '@/store/game/types';
import { useSettingsStore } from "@/store/settings/store";
import { OptionSerialNumber } from "@/types/game";
import { useCallback } from "react";

export const useFetchQuizItem = () => {
  const { difficulty, language } = useSettingsStore();
  const { currentQuestionStage, initNextQuizItem } = useGameStore();

  return useCallback((stage?: GameState['currentQuestionStage']) => {
    const fetchForStage = stage ?? currentQuestionStage + 1 as OptionSerialNumber;
    console.log({ fetchForStage });

    if (fetchForStage <= QUESTION_STAGES.length) {
      initNextQuizItem({
        stage: fetchForStage,
        difficulty,
        language,
      });
    }
  }, [currentQuestionStage, initNextQuizItem, difficulty, language]);
};
