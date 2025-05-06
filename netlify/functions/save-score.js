// functions/save-score/save-score.js
const faunadb = require('faunadb');

// FaunaDB query functions
const q = faunadb.query;

exports.handler = async (event) => {
  // Check if Fauna secret key exists
  if (!process.env.FAUNA_SERVER_SECRET) {
    console.error('FaunaDB secret key not found in environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database configuration error.' }),
    };
  }

  // Create FaunaDB client
  const client = new faunadb.Client({
    secret: process.env.FAUNA_SERVER_SECRET,
    // Use the correct domain for your Fauna region if not Classic
    // domain: 'db.us.fauna.com', // or 'db.eu.fauna.com', 'db.classic.fauna.com'
    // scheme: 'https', // Use https
  });

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, score, level } = JSON.parse(event.body);

    // Basic Server-Side Validation (Add more as needed!)
    if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 15) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid player name.'}) };
    }
    if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) {
       return { statusCode: 400, body: JSON.stringify({ error: 'Invalid score.'}) };
    }
     if (typeof level !== 'number' || level < 1 || !Number.isInteger(level)) {
       return { statusCode: 400, body: JSON.stringify({ error: 'Invalid level.'}) };
    }

    // Trim the name
    const trimmedName = name.trim();

    // --- Simple Insert Logic ---
    // This version simply adds every score submitted. The get-scores
    // function handles finding the top overall scores.
    // A more advanced version would check if the player exists and
    // only update if the new score is higher.
    const result = await client.query(
      q.Create(
        q.Collection('scores'), // Target the 'scores' collection
        {
          data: { // The document data
            name: trimmedName,
            score: score,
            level: level,
            // Fauna automatically adds a timestamp 'ts'
          },
        }
      )
    );

    console.log(`Score saved successfully for ${trimmedName}. Doc ID: ${result.ref.id}`);
    return {
      statusCode: 201, // 201 Created
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Score saved successfully!', name: trimmedName, score, level }),
    };

  } catch (error) {
    console.error('Error saving score to FaunaDB:', error);
     // Log the error details potentially
     let errorMsg = 'Failed to save score.';
     if (error.requestResult && error.requestResult.responseContent && error.requestResult.responseContent.errors) {
       errorMsg = error.requestResult.responseContent.errors[0].description || errorMsg;
     } else if (error.message) {
       errorMsg = error.message;
     }
     return {
       statusCode: 500,
       body: JSON.stringify({ error: errorMsg }),
     };
  }
};