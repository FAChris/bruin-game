// functions/get-scores/get-scores.js
const { Client, query: q } = require('fauna'); // Use require

const faunaSecret = process.env.FAUNA_SERVER_SECRET;

// Check imports and secret
if (!q || !Client) {
  // Log error during initialization phase if possible
  console.error("Failed to import Fauna Client or query builder.");
  // Cannot return from here easily, but function will fail later if needed
}
 if (!faunaSecret && process.env.NODE_ENV === 'production') { // Only hard fail in production
   console.error("FAUNA_SERVER_SECRET environment variable not set.");
   return { statusCode: 500, body: JSON.stringify({ error: "Configuration error."}) };
 }
 // Allow local development without env var potentially, but log warning
 if (!faunaSecret) {
     console.warn("FAUNA_SERVER_SECRET environment variable not set. Using placeholder or expecting failure.");
 }


const client = new Client({
  // Use a fallback empty secret if not set, query will fail but client init won't crash
  secret: faunaSecret || "undefined", // Avoid passing undefined directly
  // domain: 'db.us.fauna.com', // Still uncomment if needed
  // scheme: 'https',
});

// Use module.exports for CommonJS handler export
module.exports.handler = async (event) => {
     if (event.httpMethod !== 'GET') {
         return { statusCode: 405, body: 'Method Not Allowed' };
     }

     console.log("Attempting to fetch scores using FQL 'q' builder syntax (require)...");

     // Double-check secret existence *inside* handler for safety
     if (!faunaSecret) {
          console.error("FAUNA_SERVER_SECRET missing inside handler.");
          return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) };
     }


     try {
         // --- Query using 'q' builder syntax ---
         const query = q.Map(
             q.Paginate(
                 q.Match(q.Index("scores_sort_by_score_level_desc")),
                 { size: 10 }
             ),
             q.Lambda(
                 ['score', 'level', 'name'],
                 {
                     name: q.Var('name'),
                     score: q.Var('score'),
                     level: q.Var('level')
                 }
             )
         );
         // --- End Query ---

         const response = await client.query(query);

         console.log(`Successfully fetched ${response.data?.length ?? 0} scores.`);

         return {
             statusCode: 200,
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(response.data ?? []),
         };

     } catch (error) {
         console.error("Error fetching scores from Fauna (using 'q' builder):", error);
         const errorDescription = error.description ?? error.message ?? 'Failed to fetch scores.';
         const errorMessage = error.message?.includes("invalid ref")
           ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found or name is incorrect. Check index name.`
           : errorDescription;
         return {
           statusCode: error.requestResult?.statusCode ?? 500,
           body: JSON.stringify({ error: errorMessage }),
         };
     }
     // No finally/close needed usually
};