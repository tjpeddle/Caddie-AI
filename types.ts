
export type ShotOutcome = 'Fairway' | 'Green' | 'Rough' | 'Bunker' | 'Water' | 'OB' | 'In Hole' | 'Penalty' | 'Unknown';

export interface Shot {
  club: string;
  lie: string;
  outcome: ShotOutcome;
  notes?: string;
}

export interface HolePerformance {
  holeNumber: number;
  shots: Shot[];
  score: number;
  putts: number;
}

export interface ChatMessage {
  sender: 'user' | 'jp';
  text: string;
  timestamp: string;
  learning?: string;
}

export interface Round {
  date: string;
  conditions: string;
  holeByHole: HolePerformance[];
  totalScore: number;
  conversation: ChatMessage[];
}

export interface Hole {
  holeNumber: number;
  par: number;
  yardage: number;
  description: string;
  notes?: string[];
}

export interface Course {
  id: string;
  name: string;
  holes: Hole[];
  roundHistory: Round[];
}

export interface PlayerProfile {
  tendencies: string[];
}

export type GolfData = {
  courses: Course[];
  playerProfile?: PlayerProfile;
};
