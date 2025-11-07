// src/utils/helpers.ts

export const formatAnswer = (answer: string): string => {
    return answer.trim().toLowerCase();
};

export const shuffleArray = <T>(array: T[]): T[] => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

export const getRandomQuestion = (questions: any[]): any => {
    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
};