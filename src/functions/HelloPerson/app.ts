//Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
//SPDX-License-Identifier: MIT-0

/**
 * Lambda Handler for the typescript apigw-lambda-dynamodb example
 * This handler accepts an id that represents a persons name, and creates a "Hello {Name}!" message.
 * The id and name associated with the name is stored in a DynamoDB Table.
 * Additionally, when a message is created, the lambda logs the "Hello {Name}!" message to DynamoDB with a timestamp.
 * The DynamoDB Table used is passed as an environment variable "DYNAMODB_TABLE_NAME"
 */

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand, DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { responseBuilder } from 'commons'

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    console.log('responseBuilder', responseBuilder())
    return {
        statusCode: 200,
        body: JSON.stringify({
            helloMessage: 'hello',
        }),
    };
    let response: APIGatewayProxyResult;
    // Getting the dynamoDB table name from environment variable
    const dynamoDBTableName = process.env.DYNAMODB_TABLE_NAME;

    // User id field is passed as a path parameter
    const id = event.pathParameters.id;

    const dynamodb = new DynamoDBClient({});
    const ddb = DynamoDBDocumentClient.from(dynamodb);

    // Get the entry based on the id
    const params = { Key: { PK: id, SK: 'NAME#' }, TableName: dynamoDBTableName };
    const data = await ddb.send(new GetCommand(params));

    let helloMessage = 'Hello ';
    let statusCode = 200;
    if (data.Item) {
        const person_name = data.Item.SK;
        helloMessage = helloMessage.concat(person_name);
    } else {
        helloMessage = 'NOTFOUND: Name Not Found for ID'.concat(id);
        statusCode = 404;
    }

    // Create a timestamp and log the message back to DynamoDB
    const timestamp = String(Date.now());
    const param = { Item: { PK: id, SK: 'TS#' + timestamp, data: helloMessage }, TableName: dynamoDBTableName };
    await ddb.send(new PutCommand(param));

    try {
        response = {
            statusCode: statusCode,
            body: JSON.stringify({
                helloMessage,
            }),
        };
    } catch (err: unknown) {
        console.error(err);
        response = {
            statusCode: 500,
            body: JSON.stringify({
                message: err instanceof Error ? err.message : 'some error happened',
            }),
        };
    }
    return response;
};
