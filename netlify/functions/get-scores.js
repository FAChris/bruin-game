// functions/get-scores/get-scores.js

// --- Try requiring 'fauna' and accessing properties like the old 'faunadb' package ---
let q, Client;
let importError = null;
try {
    // Try to require the package named 'fauna' installed by npm
    const faunadbPackage = require('fauna');

    // Check if it has the expected properties of the older driver structure
    if (faunadbPackage && faunadbPackage.query && faunadbPackage.Client) {
        q = faunadbPackage.query;        // Assign the query builder
        Client = faunadbPackage.Client;   // Assign the Client constructor
        console.log("Successfully accessed Client and query from required 'fauna' package (get-scores).");
    } else {
        importError = "Required 'fauna' package does not have expected '.query' or '.Client' properties.";
        console.error(importError);
    }
} catch (e) {
    // Handle case where require('fauna') itself fails
    importError = `FATAL: require('fauna') failed in get-scores. Error: ${e.message}`;
    console.error(importError);
    // Ensure q and Client are null/undefined so handler fails safely
    q = null;
    Client = null;
}

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) { console.warn("FAUNA_SERVER_SECRET env var not set."); }

// Initialize client only if Client object was successfully imported
const client = Client ? new Client({
  secret: faunaSecret || "undefined_secret", // Use placeholder if missing
  domain: 'db.us.fauna.com',                 // Make sure this is uncommented for US region
  scheme: 'https',                           // Make sure this is uncommented
}) : null;

if (Client && !client) { console.error("Client object exists but constructor failed? (get-scores)"); }
else if (!Client) { console.error("Client constructor is undefined/falsy (get-scores)."); }

// --- Handler ---
module.exports.handler = async (event) => {
    // Check for import/setup errors inside handler
    if (importError || !q || !client) {
         console.error("Fauna query builder or client not available inside handler (get-scores). Import error:", importError);
         return { statusCode: 500, body: JSON.stringify({ error: "Server setup error."}) };
    }
    // Check for secret inside handler
    if (!faunaSecret) {
         console.error("FAUNA_SERVER_SECRET missing inside handler (get-scores).");
         return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) };
    }

    // Handle GET request
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    console.log("Attempting to fetch scores using FQL 'q' builder syntax (require)...");

    try {
        // --- Query using 'q' builder syntax ---
        const query = q.Map(
            q.Paginate(
                q.Match(q.Index("scores_sort_by_score_level_desc")), // Ensure Index name is correct
                { size: 10 } // Limit to top 10
            ),
            q.Lambda(
                ['score', 'level', 'name'], // Variables for the values returned by the index
                {                          // Object to return for each result
                    name: q.Var('name'),
                    score: q.Var('score'),
                    level: q.Var('level')
                }
            )
        );
        // --- End Query ---

        // Execute the query
        const response = await client.query(query);
        // response.data should be the array of mapped objects: [ { name: ..., score: ..., level: ... }, ... ]

        console.log(`Successfully fetched ${response.data?.length ?? 0} scores.`);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(response.data ?? []), // Return the scores array
        };

    } catch (error) {
        console.error("Error fetching scores from Fauna (using 'q' builder):", error);
        const errorDescription = error.description ?? error.message ?? 'Failed to fetch scores.';
        // Check for specific errors like index not found
        const errorMessage = error.message?.includes("invalid ref")
          ? `Failed to fetch scores. Index 'scores_sort_by_score_level_desc' not found? Check name in Fauna dashboard.`
          : errorDescription;
        return {
          statusCode: error.requestResult?.statusCode ?? 500, // Get status code from Fauna error if possible
          body: JSON.stringify({ error: errorMessage }),
        };
    }
    // No finally/close needed usually
};