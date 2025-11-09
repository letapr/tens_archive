import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, ScanCommand } from '@aws-sdk/lib-dynamodb';

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

export async function findMostRecentGame(fromDate: string): Promise<string | null> {
    // Scan the table for all games up to the given date
    const command = new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        FilterExpression: "#date <= :date",
        ExpressionAttributeNames: {
            "#date": "pk"
        },
        ExpressionAttributeValues: {
            ":date": fromDate
        }
    });

    try {
        const response = await docClient.send(command);
        if (!response.Items || response.Items.length === 0) {
            return null;
        }

        // Sort the dates in descending order and get the most recent one
        const sortedDates = response.Items
            .map(item => item.pk)
            .sort()
            .reverse();

        // Return the most recent date that's not the current date
        return sortedDates.find(date => date !== fromDate) || null;
    } catch (error) {
        console.error('Error finding most recent game:', error);
        return null;
    }
}

export async function fetchDailyGame(date?: string): Promise<GameData> {
    const gameDate = date || new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    const command = new GetCommand({
        TableName: process.env.DYNAMODB_TABLE_NAME,
        Key: {
            pk: gameDate
        }
    });

    try {
        const response = await docClient.send(command);
        
        if (!response.Item) {
            throw new Error(`No game data found for ${gameDate}`);
        }

        return {
            title: response.Item.title,
            date: response.Item.date,
            correctAnswers: response.Item.correctAnswers
        };
    } catch (error) {
        // Instead of providing fallback data, let the error propagate
        throw error;
    }
}