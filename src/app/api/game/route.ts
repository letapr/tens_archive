import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { scrapeGameData } from '@/utils/scraper';

// AWS Configuration
const client = new DynamoDBClient({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
    }
});

const docClient = DynamoDBDocumentClient.from(client);

// Validation function for the request body
const validateGameData = (data: any): boolean => {
    return (
        typeof data.title === 'string' &&
        typeof data.date === 'string' &&
        Array.isArray(data.correctAnswers) &&
        data.correctAnswers.length === 10 &&
        data.correctAnswers.every((answer: any) => typeof answer === 'string')
    );
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        // Validate date parameter
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!date || !dateRegex.test(date)) {
            return NextResponse.json(
                { error: 'Invalid or missing date parameter. Format: YYYY-MM-DD' },
                { status: 400 }
            );
        }

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        console.log('Request date:', date);
        console.log('Today\'s date:', today);

        // First try to get game data from DynamoDB
        const command = new GetCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Key: {
                pk: date
            }
        });

        try {
            const response = await docClient.send(command);
            // If found in DynamoDB, return it
            if (response.Item) {
                console.log('Found game in database');
                return NextResponse.json(response.Item);
            }
        } catch (error) {
            console.error('Error querying DynamoDB:', error);
        }

        // If it's today's game and not in database, try scraping
        if (date === today) {
            console.log('Game not in database, attempting to scrape today\'s game...');
            const scrapedData = await scrapeGameData();
            console.log('Scrape result:', scrapedData ? 'Success' : 'Failed');
            
            if (scrapedData) {
                // Save scraped data to DynamoDB
                const putCommand = new PutCommand({
                    TableName: process.env.DYNAMODB_TABLE_NAME,
                    Item: {
                        pk: date,
                        date: date,
                        ...scrapedData
                    },
                    ConditionExpression: 'attribute_not_exists(#date)',
                    ExpressionAttributeNames: {
                        '#date': 'date'
                    }
                });

                try {
                    await docClient.send(putCommand);
                    console.log('Successfully saved scraped data to database');
                } catch (error) {
                    console.error('Error saving scraped data:', error);
                }

                return NextResponse.json({
                    date,
                    ...scrapedData
                });
            }
        }

        // If we get here, the game wasn't in the database and either:
        // 1. It wasn't today's game, or
        // 2. Scraping today's game failed
        return NextResponse.json(
            { error: 'Game data not found' },
            { status: 404 }
        );

    } catch (error) {
        console.error('Error getting game data:', error);
        return NextResponse.json(
            { error: 'Failed to get game data' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate request body
        if (!validateGameData(body)) {
            return NextResponse.json(
                { error: 'Invalid request body format' },
                { status: 400 }
            );
        }

        // Format date if needed (ensure YYYY-MM-DD format)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(body.date)) {
            return NextResponse.json(
                { error: 'Date must be in YYYY-MM-DD format' },
                { status: 400 }
            );
        }

        // Ensure the date is used as the partition key with the proper attribute type
        const command = new PutCommand({
            TableName: process.env.DYNAMODB_TABLE_NAME,
            Item: {
                pk: body.date, // Using 'pk' as the partition key
                date: body.date,
                title: body.title,
                correctAnswers: body.correctAnswers
            },
            // Optional: Prevent overwriting existing items for the same date
            ConditionExpression: 'attribute_not_exists(#date)',
            ExpressionAttributeNames: {
                '#date': 'date'
            }
        });

        await docClient.send(command);

        return NextResponse.json({ message: 'Game data added successfully' }, { status: 201 });

    } catch (error: any) {
        if (error.name === 'ConditionalCheckFailedException') {
            return NextResponse.json(
                { error: 'A game for this date already exists' },
                { status: 409 }
            );
        }

        console.error('Error adding game data:', error);
        return NextResponse.json(
            { error: 'Failed to add game data' },
            { status: 500 }
        );
    }
}