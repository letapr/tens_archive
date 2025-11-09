import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

if (!process.env.AWS_REGION || 
    !process.env.AWS_ACCESS_KEY_ID || 
    !process.env.AWS_SECRET_ACCESS_KEY || 
    !process.env.DYNAMODB_TABLE_NAME) {
    throw new Error('Missing required AWS environment variables. Please check your .env.local file.');
}

// AWS Configuration
const AWS_CONFIG = {
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
};

const client = new DynamoDBClient(AWS_CONFIG);
const docClient = DynamoDBDocumentClient.from(client);

// Game constants
export const GAME_CONFIG = {
    maxLives: 5
} as const;

export interface GameData {
    title: string;
    date: string;
    correctAnswers: string[];
}

export async function fetchDailyGame(): Promise<GameData> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const command = new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
            pk: today
        }
    });

    try {
        const response = await docClient.send(command);
        
        if (!response.Item) {
            throw new Error('No game data found for today');
        }

        return {
            title: response.Item.title,
            date: response.Item.date,
            correctAnswers: response.Item.correctAnswers
        };
    } catch (error) {
        console.error('Error fetching game data:', error);
        // Fallback data in case of error
        return {
            title: "States With the Most Shoreline",
            date: today,
            correctAnswers: [
                "Alaska",
                "Florida",
                "California",
                "Hawaii",
                "Louisiana",
                "Michigan",
                "Texas",
                "Virginia",
                "Maine",
                "North Carolina"
            ]
        };
    }
}