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

  console.log("Attempting to fetch scores using FQL v10 (Paginate/Match/Index)..."); // Simplified log

  try {
    // --- FQL Query using Paginate(Match(Index("..."))) ---
    // Ensure index name is EXACTLY "scores_sort_by_score_level_desc"
    const query = fql`
      Paginate(
        Match(
          Index("scores_sort_by_score_level_desc")
        ),
        { size: 10 }
      )
    `;
    // --- End Query ---

    const response = await client.query(query);
    // response.data = { data: [ [score, level, name], ... ] }

    const scores = response.data?.data?.map(([score, level, name]) => ({
        name: name,
        score: score,
        level: level
    })) ?? [];

    console.log(`Successfully fetched ${scores.length} scores.`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores),
    };

  } catch (error) {
    console.error('Error fetching scores from Fauna:', error);
    const errorSummary = error.cause?.queryInfo?.summary ?? error.message ?? 'Failed to fetch scores.';
    const errorMessage = error.message?.includes("invalid ref")
       ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found or name is incorrect. Check index name.`
       : errorSummary;
    return {
      statusCode: error.httpStatus ?? 500,
      body: JSON.stringify({ error: errorMessage }),
    };
  } finally {
    // client.close();
  }
};