
import { ShotOutcome } from './types.ts';

export const GOLF_CLUBS = [
    'Driver', '3-Wood', '5-Wood', 'Hybrid',
    '3-Iron', '4-Iron', '5-Iron', '6-Iron', '7-Iron', '8-Iron', '9-Iron',
    'Pitching Wedge', 'Gap Wedge', 'Sand Wedge', 'Lob Wedge', 'Putter'
];

export const SHOT_OUTCOMES: ShotOutcome[] = [
    'Fairway', 'Green', 'Rough', 'Bunker', 'Water', 'OB', 'In Hole', 'Penalty'
];

export const LIE_TYPES = [
    'Tee Box', 'Fairway', 'Rough', 'Bunker', 'Green', 'Fringe'
];
