// functions/save-score/save-score.js

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
        console.log("Successfully accessed Client and query from required 'fauna' package (save-score).");
    } else {
        importError = "Required 'fauna' package does not have expected '.query' or '.Client' properties.";
        console.error(importError);
    }
} catch (e) {
    // Handle case where require('fauna') itself fails
    importError = `FATAL: require('fauna') failed in save-score. Error: ${e.message}`;
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

if (Client && !client) { console.error("Client object exists but constructor failed? (save-score)"); }
else if (!Client) { console.error("Client constructor is undefined/falsy (save-score)."); }


// --- Handler ---
module.exports.handler = async (event) => {
    // Check for import/setup errors inside handler
    if (importError || !q || !client) {
         console.error("Fauna query builder or client not available inside handler (save-score). Import error:", importError);
         return { statusCode: 500, body: JSON.stringify({ error: "Server setup error."}) };
    }
    // Check for secret inside handler
    if (!faunaSecret) {
         console.error("FAUNA_SERVER_SECRET missing inside handler (save-score).");
         return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error."}) };
    }

    // Handle POST request
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { name, score, level } = body;

        // Basic Server-Side Validation
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
          ? `Failed to save score. Collection 'scores' not found? Check name in Fauna dashboard.`
          : errorDescription;
        return {
          statusCode: error.requestResult?.statusCode ?? 500, // Get status code from Fauna error if possible
          body: JSON.stringify({ error: errorMessage }),
        };
    }
    // No finally/close needed usually
};