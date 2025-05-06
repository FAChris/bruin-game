// functions/save-score/save-score.js
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
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);
    const { name, score, level } = body;

    // Basic Server-Side Validation (Keep/enhance this!)
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 15) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid player name.'}) };
    }
    if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
       return { statusCode: 400, body: JSON.stringify({ error: 'Invalid score.'}) };
    }
     if (typeof level !== 'number' || level < 1 || !Number.isInteger(level)) {
       return { statusCode: 400, body: JSON.stringify({ error: 'Invalid level.'}) };
    }
    const trimmedName = name.trim();

    console.log(`Attempting to save score for ${trimmedName} using FQL v10...`);

    // FQL v10 Query - Create a new document in the 'scores' collection
    const query = fql`
      scores.create({
        name: ${trimmedName},
        score: ${score},
        level: ${level}
      })
    `;

    // Execute the query
    const response = await client.query(query);

    console.log(`Score saved successfully for ${trimmedName}. Doc ID: ${response.data?.id}`); // Access id via response.data.id

    return {
      statusCode: 201, // 201 Created
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Score saved successfully!',
        id: response.data?.id, // Send back the ID of the created doc
        name: trimmedName,
        score,
        level
      }),
    };

  } catch (error) {
    console.error('Error saving score to Fauna:', error);
    // Extract more specific error message if available
    const errorMessage = error.cause?.queryInfo?.summary ?? error.message ?? 'Failed to save score.';
     return {
       statusCode: error.httpStatus ?? 500, // Use Fauna's status code if available
       body: JSON.stringify({ error: errorMessage }),
     };
  } finally {
     // Optional: Close client if needed, though usually managed automatically
     // client.close();
  }
};