// functions/get-scores/get-scores.js
import { Client, fql } from 'fauna'; // Use new import style

// --- IMPORTANT: Environment Variable Check ---
// Ensure FAUNA_SERVER_SECRET is set in your Netlify environment!
const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
  throw new Error("FAUNA_SERVER_SECRET environment variable not set.");
}
// --- Client Setup ---
// Automatically handles region based on secret, usually no need for domain/scheme
const client = new Client({
  secret: faunaSecret,
});

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  console.log("Attempting to fetch scores using FQL v10...");

  try {
    // FQL v10 Query - fetch top 10 sorted by score, then level
    const query = fql`
      scores.all().orderBy(.score ~ "desc", .level ~ "desc").map(s => ({
        name: s.name,
        score: s.score,
        level: s.level
      })).first(10)
    `;

    // Execute the query
    const response = await client.query(query);

    console.log(`Successfully fetched ${response.data?.length ?? 0} scores.`);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      // response.data should already be the array of objects
      body: JSON.stringify(response.data ?? []),
    };

  } catch (error) {
    console.error('Error fetching scores from Fauna:', error);
    // Extract more specific error message if available
    const errorMessage = error.cause?.queryInfo?.summary ?? error.message ?? 'Failed to fetch scores.';
    return {
      statusCode: error.httpStatus ?? 500, // Use Fauna's status code if available
      body: JSON.stringify({ error: errorMessage }),
    };
  } finally {
    // Optional: Close client if needed, though usually managed automatically
    // client.close();
  }
};