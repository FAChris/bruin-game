// functions/save-score/save-score.js
const { Client, query: q } = require('fauna'); // Use require

const faunaSecret = process.env.FAUNA_SERVER_SECRET;

// Basic checks during init
if (!q || !Client) {
  console.error("Failed to import Fauna Client or query builder.");
}
 if (!faunaSecret && process.env.NODE_ENV === 'production') {
   console.error("FAUNA_SERVER_SECRET environment variable not set.");
   // Cannot easily return error here, but handler will fail later if needed
 } else if (!faunaSecret) {
     console.warn("FAUNA_SERVER_SECRET environment variable not set.");
 }


const client = new Client({
  secret: faunaSecret || "undefined_secret", // Use placeholder if missing
  // domain: 'db.us.fauna.com', // Still uncomment if needed for US region
  // scheme: 'https',
});

// Use module.exports for CommonJS handler export
module.exports.handler = async (event) => {
     if (event.httpMethod !== 'POST') {
         return { statusCode: 405, body: 'Method Not Allowed' };
     }

     // Check secret inside handler
     if (!faunaSecret) {
          console.error("FAUNA_SERVER_SECRET missing inside handler.");
          return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) };
     }
     // Check q inside handler
      if (!q) {
          console.error("Fauna query builder ('q') is not available.");
          return { statusCode: 500, body: JSON.stringify({ error: "Server setup error."}) };
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

         console.log(`Attempting to save score for ${trimmedName} using FQL 'q' builder...`);

         // --- Query using 'q' builder syntax ---
         // This simply creates a new score document every time
         const query = q.Create(
             q.Collection('scores'), // Target the 'scores' collection
             {
               data: { // The document data
                 name: trimmedName,
                 score: score,
                 level: level,
               },
             }
           );
         // --- End Query ---

         // Execute the query
         const response = await client.query(query);
         // response contains { ref, ts, data } for the created document

         console.log(`Score saved successfully for ${trimmedName}. Doc Ref: ${response.ref.id}`);

         return {
           statusCode: 201, // 201 Created
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             message: 'Score saved successfully!',
             id: response.ref.id, // Send back the ID of the created doc
             name: trimmedName,
             score,
             level
           }),
         };

     } catch (error) {
         console.error("Error saving score to Fauna (using 'q' builder):", error);
         const errorDescription = error.description ?? error.message ?? 'Failed to save score.';
         // Check for specific errors like collection not found
         const errorMessage = error.message?.includes("invalid ref")
           ? `Failed to save score. Collection 'scores' not found or name is incorrect?`
           : errorDescription;
         return {
           statusCode: error.requestResult?.statusCode ?? 500, // Get status from requestResult if available
           body: JSON.stringify({ error: errorMessage }),
         };
     }
};