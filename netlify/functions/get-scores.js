// functions/get-scores/get-scores.js
import { Client, query as q } from 'fauna'; // <--- Import 'query as q'

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
  throw new Error("FAUNA_SERVER_SECRET environment variable not set.");
}
const client = new Client({
  secret: faunaSecret,
  // domain: 'db.us.fauna.com', // Still uncomment this if needed for US region
  // scheme: 'https',
});

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log("Attempting to fetch scores using FQL 'q' builder syntax..."); // Updated log

  try {
    // --- Fallback Query using 'q' builder syntax ---
    // This structure explicitly defines the steps
    const query = q.Map( // 3. Map the results
        q.Paginate(      // 2. Paginate the matched set
            q.Match(q.Index("scores_sort_by_score_level_desc")), // 1. Match the index (get SetRef)
            { size: 10 } // Options for Paginate
        ),
        q.Lambda(        // Function to apply to each result from the page
          ['score', 'level', 'name'], // Variables for the values returned by the index
          {                // Object to return for each result
            name: q.Var('name'),
            score: q.Var('score'),
            level: q.Var('level')
          }
        )
    );
    // --- End Query ---

    // Execute the query
    const response = await client.query(query);
    // With q.Map, response.data should be the final array of objects
    // e.g., { data: [ { name: ..., score: ..., level: ... }, ... ] }

    console.log(`Successfully fetched ${response.data?.length ?? 0} scores.`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      // Use response.data directly as q.Map should have formatted it
      body: JSON.stringify(response.data ?? []),
    };

  } catch (error) {
    console.error("Error fetching scores from Fauna (using 'q' builder):", error);
     // q builder errors might have different structure
    const errorDescription = error.description ?? error.message ?? 'Failed to fetch scores.';
    const errorMessage = error.message?.includes("invalid ref")
       ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found or name is incorrect. Check index name.`
       : errorDescription;
    return {
      statusCode: error.requestResult?.statusCode ?? 500, // Get status from requestResult if available
      body: JSON.stringify({ error: errorMessage }),
    };
  } finally {
    // client.close();
  }
};