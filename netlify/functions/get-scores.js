// functions/get-scores/get-scores.js
import { Client, fql } from 'fauna';

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
  throw new Error("FAUNA_SERVER_SECRET environment variable not set.");
}
const client = new Client({
  secret: faunaSecret,
});

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log("Attempting to fetch scores using FQL v10 (querying index)..."); // Updated log

  try {
    // --- CORRECTED QUERY v3: Using the pre-sorted index ---
    // This query fetches the raw data from the index page.
    // The index 'scores_sort_by_score_level_desc' returns [score, level, name] arrays.
    const query = fql`
      paginate(match(index('scores_sort_by_score_level_desc')), { size: 10 })
    `;
    // --- End Correction ---

    // Execute the query
    const response = await client.query(query);
    // response.data contains { data: [ [score, level, name], [score, level, name], ... ] }

    // --- ADDED: Map the results from arrays to objects in JavaScript ---
    const scores = response.data?.data?.map(([score, level, name]) => ({
        name: name,
        score: score,
        level: level
    })) ?? []; // If response.data or response.data.data is missing, default to empty array
    // --- End Added Mapping ---

    console.log(`Successfully fetched ${scores.length} scores.`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores), // Return the mapped array of objects
    };

  } catch (error) {
    console.error('Error fetching scores from Fauna:', error);
    // Try to get a more detailed error summary if available
    const errorSummary = error.cause?.queryInfo?.summary ?? error.message ?? 'Failed to fetch scores.';
    // If it's an instance not found error (index missing), provide a specific hint
    const errorMessage = error.message?.includes("instance not found")
       ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found or not readable. Check index name and key permissions.`
       : errorSummary;
    return {
      statusCode: error.httpStatus ?? 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  } finally {
    // client.close(); // Usually not needed for serverless
  }
};