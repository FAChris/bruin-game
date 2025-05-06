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

  console.log("Attempting to fetch scores using FQL v10 (paginating index directly)..."); // Updated log

  try {
    // --- CORRECTED QUERY v5: Paginating the index directly ---
    const query = fql`
      index('scores_sort_by_score_level_desc')
        .paginate({ size: 10 })
    `;
    // --- End Correction ---

    // Execute the query
    const response = await client.query(query);
    // response.data should still contain { data: [ [score, level, name], ... ] }

    // --- Map the results (Keep this) ---
    const scores = response.data?.data?.map(([score, level, name]) => ({
        name: name,
        score: score,
        level: level
    })) ?? [];
    // --- End Mapping ---

    console.log(`Successfully fetched ${scores.length} scores.`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores),
    };

  } catch (error) {
    console.error('Error fetching scores from Fauna:', error);
    const errorSummary = error.cause?.queryInfo?.summary ?? error.message ?? 'Failed to fetch scores.';
    const errorMessage = error.message?.includes("instance not found") || error.message?.includes("invalid ref") // Added check for invalid ref too
       ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found or not readable. Check index name and key permissions.`
       : errorSummary;
    return {
      statusCode: error.httpStatus ?? 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  } finally {
    // client.close();
  }
};