// functions/get-scores/get-scores.js
import { Client, fql } from 'fauna'; // Match working save-score.js

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
  // Log error during initialization for clarity, but let handler manage response
  console.error("FAUNA_SERVER_SECRET environment variable not set during function init.");
}
const client = new Client({
  secret: faunaSecret || "MISSING_SECRET", // Use placeholder if missing
  // domain: 'db.us.fauna.com', // Keep uncommented if needed for US region
  // scheme: 'https',
});

export const handler = async (event) => { // Match working save-score.js export style
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Check secret again inside handler
  if (!faunaSecret) {
       console.error("FAUNA_SERVER_SECRET missing inside handler execution.");
       return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) };
  }

  console.log("Attempting to fetch scores using FQL v10 (match.map.paginate)...");

  try {
    // --- CORRECTED QUERY v11: Using match().map().paginate() structure ---
    // 1. Match all entries in the sorted index (returns a SetRef)
    // 2. Map each entry (the raw index value: [score, level, name]) to an object
    // 3. Paginate the resulting set of objects
    const query = fql`
      match(index("scores_sort_by_score_level_desc"))
        .map(row => ({ // Map the raw [score, level, name] array from the index
          score: row[0],
          level: row[1],
          name: row[2]
        }))
        .paginate({ size: 10 }) // Paginate the set of *objects*
    `;
    // --- End Correction ---

    // Execute the query
    const response = await client.query(query);
    // The result should be { data: [ { name:..., score:..., level:... }, ... ] }
    // Note: .paginate() returns an object with a 'data' array field

    const scores = response.data?.data ?? []; // Extract the actual array of scores from the page object

    console.log(`Successfully fetched ${scores.length} scores.`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores), // Return the array of score objects
    };

  } catch (error) {
    console.error('Error fetching scores from Fauna (match.map.paginate attempt):', error);
    const errorSummary = error.cause?.queryInfo?.summary ?? error.message ?? 'Failed to fetch scores.';
    // Check for specific errors like index not found
    const errorMessage = error.message?.includes("invalid ref") || errorSummary.includes("index") || errorSummary.includes("Index")
       ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found, name incorrect, or issue with query structure. Check index & query.`
       : errorSummary;
    const statusCode = error.httpStatus ?? error.requestResult?.statusCode ?? 500;
    return {
      statusCode: statusCode,
      body: JSON.stringify({ error: errorMessage }),
    };
  } finally {
    // client.close(); // Usually managed automatically
  }
};