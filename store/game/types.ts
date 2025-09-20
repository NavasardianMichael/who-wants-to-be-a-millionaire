import { GetQuizAPI } from "@/api/getQuiz";
import { OptionSerialNumber, QuestionStage } from "@/types/game";

export type GameState = {
  isPending: boolean;
  currentQuestionStage: QuestionStage;
  quiz: QuizItem[];
  isSidebarOpen: boolean;
};

export type QuizItem = {
  id: string;
  question: string;
  options: string[];
  answeredOptionSerialNumber: OptionSerialNumber | null;
  correctOptionSerialNumber: OptionSerialNumber;
};

export type GameStateActions = {
  setGameState: (state: Partial<GameState>) => void;
  setIsSidebarOpen: (isOpen: boolean) => void;
  toggleIsSidebarOpen: () => void;
  setAnsweredOptionSerialNumber: (
    serialNumber: OptionSerialNumber | null
  ) => void;
  initQuiz: (payload: GetQuizAPI["payload"]) => Promise<GameState["quiz"]>;
};
