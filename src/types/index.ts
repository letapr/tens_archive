// src/types/index.ts

export interface GameData {
    pk: string;
    date: string;
    title: string;
    correctAnswers: string[];
}

export interface GameResponse {
    error?: string;
    data?: GameData;
    message?: string;
}