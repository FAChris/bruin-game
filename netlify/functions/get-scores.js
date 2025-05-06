// functions/get-scores/get-scores.js
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
     if (event.httpMethod !== 'GET') { return { statusCode: 405, body: 'Method Not Allowed' }; }
     if (!faunaSecret) { return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) }; }
     if (!q) { return { statusCode: 500, body: JSON.stringify({ error: "Server setup error (q missing)." }) }; }

     console.log("Attempting to fetch scores using FQL 'q' builder syntax (require)...");

     try {
         // Query using 'q' builder syntax
         const query = q.Map(
             q.Paginate(
                 q.Match(q.Index("scores_sort_by_score_level_desc")), // Ensure Index name is correct
                 { size: 10 }
             ),
             q.Lambda(
                 ['score', 'level', 'name'], // Vars for values from index
                 { name: q.Var('name'), score: q.Var('score'), level: q.Var('level') } // Map to object
             )
         );
         const response = await client.query(query);
         // response.data should be [ { name: ..., score: ..., level: ... }, ... ]
         console.log(`Successfully fetched ${response.data?.length ?? 0} scores.`);
         return {
             statusCode: 200, headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(response.data ?? []),
         };
     } catch (error) {
         console.error("Error fetching scores from Fauna (using 'q' builder):", error);
         const errorDescription = error.description ?? error.message ?? 'Failed to fetch scores.';
         const errorMessage = error.message?.includes("invalid ref") ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found? Check name.` : errorDescription;
         return { statusCode: error.requestResult?.statusCode ?? 500, body: JSON.stringify({ error: errorMessage }) };
     }
};