// netlify/functions/save-score.js
import { Client, fql, QueryValue } from 'fauna'; // Use new import style

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
    console.error("Fauna secret not found.");
    return { statusCode: 500, body: JSON.stringify({ error: "Server configuration error." }), headers: { 'Access-Control-Allow-Origin': '*' } };
}

const client = new Client({ secret: faunaSecret });

// Validation function remains the same
function isValidScoreData(data) { /* ... */ }
function sanitizeName(name) { /* ... */ }

export const handler = async (event, context) => {
    // Handle CORS Preflight request
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed', headers: { 'Allow': 'POST, OPTIONS' } };
    }

    console.log("Function 'save-score' (v10) invoked.");

    let scoreData;
    try {
        scoreData = JSON.parse(event.body);
    } catch (error) {
        console.error("Error parsing request body:", error);
        return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid request body. Expected JSON.' }) };
    }

    if (!isValidScoreData(scoreData)) {
        console.warn("Invalid score data received:", scoreData);
        return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid score data provided.' }) };
    }

    const cleanName = sanitizeName(scoreData.name);
    // Prepare data for saving, use fql`Time.now()` for timestamp
    const scoreToSave = {
        name: cleanName,
        score: scoreData.score,
        level: scoreData.level,
        timestamp: fql`Time.now()` // FQL v10 syntax for timestamp
    };

    console.log("Attempting to save validated data (v10):", { ...scoreToSave, timestamp: "Time.now()" }); // Log placeholder for timestamp

    try {
        // FQL v10: Check for existing entry using the unique index
        // Assumes 'leaderboard_by_name' index exists and is unique on data.name
        // It returns the document directly if found, or null
        const checkQuery = fql`
          let nameToCheck = ${cleanName}
          leaderboard.where(.name == nameToCheck).first()
        `;
        const existingEntryResult = await client.query(checkQuery);
        const existingDoc = existingEntryResult?.data; // data contains the document or null

        let savedDocId = null;

        if (existingDoc) {
             console.log(`Found existing entry for ${cleanName} with score ${existingDoc.score}, level ${existingDoc.level}`);
             // Only update if the new score is better
             if (scoreToSave.score > existingDoc.score || (scoreToSave.score === existingDoc.score && scoreToSave.level > existingDoc.level)) {
                  console.log("New score is better. Updating...");
                  const updateQuery = fql`
                     let docRef = Document(Collection("leaderboard"), ${existingEntryResult.id}) // Get the Ref ID
                     docRef.update(${scoreToSave}) // Use the new score data
                  `;
                  const updateResult = await client.query(updateQuery);
                  savedDocId = updateResult.id; // Get ID from update result
             } else {
                  console.log("New score is not better. Skipping update.");
                  savedDocId = existingEntryResult.id; // Use existing ID
             }

        } else {
             console.log(`No existing entry found for ${cleanName}. Creating new one.`);
             const createQuery = fql`
                leaderboard.create(${scoreToSave})
             `;
             const createResult = await client.query(createQuery);
             savedDocId = createResult.id; // Get ID from create result
        }


        console.log("Score saved/updated successfully (v10). Doc ID:", savedDocId);

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true, id: savedDocId }),
        };

    } catch (error) {
        console.error("Error saving score to Fauna (v10):", error);
        const errorMessage = error.message || 'Failed to save score.';
        const errorDetails = error.cause ? JSON.stringify(error.cause) : '';
        console.error("Fauna Error Details:", errorDetails)

        // Try to get specific Fauna error code if possible
        let statusCode = 500;
        if (error.httpStatus) {
            statusCode = error.httpStatus;
        } else if (error.cause?.code === 'instance not unique') { // Example specific error check
            statusCode = 409; // Conflict
        }

        return {
            statusCode: statusCode,
            headers: { 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: errorMessage, details: errorDetails }),
        };
    } finally {
       // client.close();
    }
};

// --- Make sure validation/sanitize functions are included ---
function isValidScoreData(data) {
    if (!data || typeof data !== 'object') return false;
    const { name, score, level } = data;
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 25) { console.warn("Validation failed: Invalid name", name); return false; }
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 999999) { console.warn("Validation failed: Invalid score", score); return false; }
    if (typeof level !== 'number' || !Number.isInteger(level) || level <= 0 || level > 99) { console.warn("Validation failed: Invalid level", level); return false; }
    return true;
}
function sanitizeName(name) {
   return name.replace(/[^a-zA-Z0-9 _-]/g, '').trim().substring(0, 15);
}
// --- End validation/sanitize functions ---