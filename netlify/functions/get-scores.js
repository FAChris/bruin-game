// netlify/functions/get-scores.js (or .mjs)
import { db } from './_firebase-admin-init.js'; // Import initialized db

const leaderboardCol = db.collection('leaderboard'); // Reference your collection

export const handler = async (event, context) => {
    // --- CORS Preflight Handling (KEEP THIS) ---
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers: {
                'Access-Control-Allow-Origin': '*', // Adjust for production
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: ''
        };
    }
    // --- Method Check (KEEP THIS) ---
     if (event.httpMethod !== 'GET') {
         return { statusCode: 405, body: 'Method Not Allowed', headers: { 'Allow': 'GET, OPTIONS', 'Access-Control-Allow-Origin': '*' } };
     }

    console.log("Function 'get-scores' (Firestore) invoked.");
    try {
        const snapshot = await leaderboardCol
            .orderBy('score', 'desc') // Order by score descending
            .orderBy('level', 'desc') // Then by level descending
            .limit(10)                // Limit to top 10
            .get();

        if (snapshot.empty) {
            console.log('No scores found.');
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
                body: JSON.stringify([]) // Return empty array
            };
        }

        // Map Firestore documents to simple objects
        const scores = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            scores.push({
                // id: doc.id, // You could include the Firestore doc ID if needed
                name: data.name || 'Anonymous', // Add fallback
                score: data.score || 0,
                level: data.level || 1,
                // Convert Firestore Timestamp to ISO string for JSON compatibility
                timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : null
            });
        });

        console.log(`${scores.length} scores retrieved successfully.`);
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify(scores)
        };

    } catch (error) {
        console.error("Error fetching scores from Firestore:", error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            body: JSON.stringify({ error: 'Failed to fetch scores from database.' })
        };
    }
};