// functions/save-score/save-score.js
const { Client, query: q } = require('fauna'); // Use require

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!q || !Client) { console.error("Fauna Client/Query failed import"); }
if (!faunaSecret) { console.warn("FAUNA_SERVER_SECRET not set"); }

const client = new Client({
  secret: faunaSecret || "undefined_secret",
  domain: 'db.us.fauna.com', // Make sure this is uncommented for US region
  scheme: 'https',           // Make sure this is uncommented
});

module.exports.handler = async (event) => {
     if (event.httpMethod !== 'POST') { return { statusCode: 405, body: 'Method Not Allowed' }; }
     if (!faunaSecret) { return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) }; }
     if (!q) { return { statusCode: 500, body: JSON.stringify({ error: "Server setup error (q missing)." }) }; }

     try {
         const body = JSON.parse(event.body);
         const { name, score, level } = body;
         // Validation
         if (!name || typeof name !== 'string' || name.trim().length === 0 || name.length > 15) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid player name.'}) }; }
         if (typeof score !== 'number' || score < 0 || !Number.isInteger(score)) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid score.'}) }; }
         if (typeof level !== 'number' || level < 1 || !Number.isInteger(level)) { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid level.'}) }; }
         const trimmedName = name.trim();
         console.log(`Attempting to save score for ${trimmedName} using FQL 'q' builder...`);
         // Query using 'q' builder syntax
         const query = q.Create(
             q.Collection('scores'), { data: { name: trimmedName, score: score, level: level } }
         );
         const response = await client.query(query);
         console.log(`Score saved successfully for ${trimmedName}. Doc Ref: ${response.ref.id}`);
         return {
           statusCode: 201, headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ message: 'Score saved successfully!', id: response.ref.id, name: trimmedName, score, level }),
         };
     } catch (error) {
         console.error("Error saving score to Fauna (using 'q' builder):", error);
         const errorDescription = error.description ?? error.message ?? 'Failed to save score.';
         const errorMessage = error.message?.includes("invalid ref") ? `Failed to save score. Collection 'scores' not found?` : errorDescription;
         return { statusCode: error.requestResult?.statusCode ?? 500, body: JSON.stringify({ error: errorMessage }) };
     }
};