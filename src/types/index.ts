// src/types/index.ts

export interface Question {
    id: number;
    question: string;
    answers: string[];
    correctAnswer: string;
}

export interface GameData {
    title: string;
    questions: Question[];
}