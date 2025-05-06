// functions/get-scores/get-scores.js
const { Client, query: q } = require('fauna'); // Use require

const faunaSecret = process.env.FAUNA_SERVER_SECRET;

// Check imports and secret
if (!q || !Client) {
  console.error("Failed to import Fauna Client or query builder.");
  // Allow execution to continue, it will fail later if q is truly missing
}
 if (!faunaSecret && process.env.NODE_ENV === 'production') {
   console.error("FAUNA_SERVER_SECRET environment variable not set.");
   return { statusCode: 500, body: JSON.stringify({ error: "Configuration error."}) };
 }
 if (!faunaSecret) {
     console.warn("FAUNA_SERVER_SECRET environment variable not set. Using placeholder or expecting failure.");
 }

const client = new Client({
  secret: faunaSecret || "undefined_secret", // Use placeholder if missing
  // domain: 'db.us.fauna.com', // Still uncomment if needed for US region
  // scheme: 'https',
});

// Use module.exports for CommonJS handler export
module.exports.handler = async (event) => {
     if (event.httpMethod !== 'GET') {
         return { statusCode: 405, body: 'Method Not Allowed' };
     }

     console.log("Attempting to fetch scores using FQL 'q' builder syntax (require)...");

     if (!faunaSecret) {
          console.error("FAUNA_SERVER_SECRET missing inside handler.");
          return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) };
     }
     // Add check if q was imported correctly
      if (!q) {
          console.error("Fauna query builder ('q') is not available.");
          return { statusCode: 500, body: JSON.stringify({ error: "Server setup error."}) };
      }

     try {
         // --- Query using 'q' builder syntax ---
         const query = q.Map(
             q.Paginate(
                 q.Match(q.Index("scores_sort_by_score_level_desc")), // Ensure Index name is correct!
                 { size: 10 }
             ),
             q.Lambda(
                 ['score', 'level', 'name'], // Vars for values from index
                 {                          // Object to return
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
             body: JSON.stringify(response.data ?? []), // q.Map returns { data: [...] }
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
};