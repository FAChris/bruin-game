// netlify/functions/save-score.js (or .mjs)
import admin from 'firebase-admin'; // Import admin for FieldValue
import { db } from './_firebase-admin-init.js'; // Import initialized db

const leaderboardCol = db.collection('leaderboard'); // Reference your collection

// --- Validation/Sanitize Functions (KEEP or Copy from previous version) ---
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
// --- End Validation/Sanitize ---

export const handler = async (event, context) => {
    // --- CORS Preflight Handling (KEEP THIS) ---
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*', // Adjust for production
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: ''
        };
    }
     // --- Method Check (KEEP THIS) ---
     if (event.httpMethod !== 'POST') {
         return { statusCode: 405, body: 'Method Not Allowed', headers: { 'Allow': 'POST, OPTIONS', 'Access-Control-Allow-Origin': '*' } };
     }

    console.log("Function 'save-score' (Firestore) invoked.");

    let scoreData;
    try {
        scoreData = JSON.parse(event.body);
    } catch (error) {
        console.error("Error parsing request body:", error);
        return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid request body.' }) };
    }

    // --- SERVER-SIDE VALIDATION (KEEP THIS) ---
    if (!isValidScoreData(scoreData)) {
        console.warn("Invalid score data received:", scoreData);
        return { statusCode: 400, headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ error: 'Invalid score data provided.' }) };
    }

    const cleanName = sanitizeName(scoreData.name);
    // Prepare data object, using Firestore server timestamp
    const scorePayload = {
        name: cleanName,
        score: scoreData.score,
        level: scoreData.level,
        timestamp: admin.firestore.FieldValue.serverTimestamp() // Correct way for timestamp
    };

    console.log("Attempting to save validated data (Firestore):", { ...scorePayload, timestamp: "SERVER_TIMESTAMP" });

    try {
        // Check if player exists using a query on the 'name' field
        const querySnapshot = await leaderboardCol.where('name', '==', cleanName).limit(1).get();

        let docId = null;

        if (!querySnapshot.empty) {
            // Player EXISTS - Update if score is better
            const docRef = querySnapshot.docs[0].ref; // Get reference to the existing doc
            const existingData = querySnapshot.docs[0].data();
            docId = docRef.id; // Store the existing doc ID

            console.log(`Found existing entry for ${cleanName} with score ${existingData.score}, level ${existingData.level}`);

            if (scorePayload.score > existingData.score || (scorePayload.score === existingData.score && scorePayload.level > existingData.level)) {
                console.log("New score is better. Updating...");
                await docRef.update(scorePayload); // Update the existing document
                console.log("Score updated successfully. Doc ID:", docId);
            } else {
                console.log("New score is not better. Skipping write.");
                // No database write needed, but operation considered successful
            }
        } else {
            // Player DOES NOT EXIST - Create new entry
            console.log(`No existing entry found for ${cleanName}. Creating new one.`);
            const newDocRef = await leaderboardCol.add(scorePayload); // Add new doc with auto-generated ID
            docId = newDocRef.id; // Store the new doc ID
            console.log("Score created successfully. Doc ID:", docId);
        }

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ success: true, id: docId }), // Return the doc ID
        };

    } catch (error) {
        console.error("Error saving score to Firestore:", error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Failed to save score to database.' }),
        };
    }
};