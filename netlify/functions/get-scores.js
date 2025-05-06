// netlify/functions/get-scores.js
import { Client, fql } from 'fauna'; // Use new import style

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
    console.error("Fauna secret not found.");
    // Return error immediately if secret is missing
    return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error." }),
        headers: { 'Access-Control-Allow-Origin': '*' } // Include CORS for error
    };
}

const client = new Client({ secret: faunaSecret });

export const handler = async (event, context) => {
    // Handle CORS Preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed', headers: { 'Allow': 'GET, OPTIONS' } };
    }

    console.log("Function 'get-scores' (v10) invoked.");

    try {
        // FQL v10 Query:
        // Assumes 'scores_by_score_desc' index *Values* are ordered: score, level, name, ref, timestamp
        // We sort by score desc, then level desc in the index itself.
        // Here we map the results to the desired output format and take the top 10.
        const query = fql`
          scores_by_score_desc.all().map(entry => ({
            score: entry[0], // Access by index based on Values order
            level: entry[1],
            name: entry[2],
            timestamp: entry[4] // Assuming timestamp is 5th value (index 4)
            // ref (entry[3]) is not usually needed by client
          }))[:10] // Get first 10 elements (adjust limit as needed)
        `;

        const response = await client.query(query);

        // v10 returns data directly under 'data' property
        const scores = response.data;
        console.log(`${scores?.length ?? 0} scores retrieved successfully.`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify(scores || []), // Return empty array if null/undefined
        };
    } catch (error) {
        console.error("Error fetching scores from Fauna (v10):", error);
        // Log the detailed error if available
        const errorMessage = error.message || 'Failed to fetch scores.';
        const errorDetails = error.cause ? JSON.stringify(error.cause) : ''; // Fauna errors often have details in 'cause'
        console.error("Fauna Error Details:", errorDetails)

        return {
            statusCode: error.httpStatus || 500, // Use httpStatus if available
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: errorMessage, details: errorDetails }),
        };
    } finally {
        // Optional: Close client if necessary, though often reused in serverless
        // client.close();
    }
};