export interface Feedback {
  performanceAndGrowth1on1: string;
  leaderReview: string;
  selfReview: string;
  peerReview: string;
  hrReview: string;
}

export interface FinalFeedback {
  kc: boolean; // Key Contributor
  cvc: boolean; // Core Value Champion
  lc: boolean; // Leadership Champion
  other: boolean; // 기타
}

export interface Employee {
  id: number;
  organization: {
    department: string;
    team: string;
  };
  name: string;
  role: string;
  years: number;
  feedback: Feedback;
  finalFeedback: FinalFeedback;
  currentSalary: number;
  additionalBudget: number;
  personality: string;
  reactionToSalary: string;
  calibrationRecord: string;
}

export type ProcessedEmployee = Employee & {
  keyPersonnelBonus: number;
  totalIncreaseAmount: number;
  increaseRate: number;
  nextYearSalary: number;
  departmentRank: string;
  departmentRankPercentile: number;
};


export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
