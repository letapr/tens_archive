import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

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