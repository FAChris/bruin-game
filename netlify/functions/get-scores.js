// functions/get-scores/get-scores.js
import { Client, fql } from 'fauna';

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
  console.error("FAUNA_SERVER_SECRET environment variable not set during function init.");
}
const client = new Client({
  secret: faunaSecret || "MISSING_SECRET",
  domain: 'db.us.fauna.com', // Keep uncommented if needed
  scheme: 'https',
});

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Check secret again inside handler
  if (!faunaSecret) {
       console.error("FAUNA_SERVER_SECRET missing inside handler execution.");
       return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) };
  }

  console.log("Attempting to fetch scores using FQL v10 (match.map.take)..."); // Updated log

  try {
    // --- CORRECTED QUERY v12: Using .take(10) instead of .paginate({...}) ---
    const query = fql`
      match(index("scores_sort_by_score_level_desc"))
        .map(row => ({ // Map the raw [score, level, name] array
          score: row[0],
          level: row[1],
          name: row[2]
        }))
        .take(10) // Limit to the first 10 results from the mapped set
    `;
    // --- End Correction ---

    // Execute the query
    const response = await client.query(query);
    // The result of .take(10) should be the array directly { data: [ {obj1}, {obj2}... ] }

    const scores = response.data ?? []; // Default to empty array

    console.log(`Successfully fetched ${scores.length} scores.`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores), // Return the array of score objects
    };

  } catch (error) {
    console.error('Error fetching scores from Fauna (match.map.take attempt):', error);
    const errorSummary = error.cause?.queryInfo?.summary ?? error.message ?? 'Failed to fetch scores.';
    const errorMessage = error.message?.includes("invalid ref") || errorSummary.includes("index") || errorSummary.includes("Index")
       ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found, name incorrect, or issue with query structure. Check index & query.`
       : errorSummary;
    const statusCode = error.httpStatus ?? error.requestResult?.statusCode ?? 500;
    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: errorMessage }),
    };
  } finally {
    // client.close();
  }
};