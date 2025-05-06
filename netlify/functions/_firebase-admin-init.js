// netlify/functions/_firebase-admin-init.js (or .mjs)
import admin from 'firebase-admin';

// Check if already initialized (important for serverless cold starts)
if (!admin.apps.length) {
    console.log("Initializing Firebase Admin SDK...");
    const encodedKey = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

    if (!encodedKey) {
        throw new Error("FIREBASE_SERVICE_ACCOUNT_BASE64 env var not set. Deployment failed?");
    }

    try {
        // Decode the Base64 key
        const decodedKey = Buffer.from(encodedKey, 'base64').toString('utf8');
        const serviceAccount = JSON.parse(decodedKey);

        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("Firebase Admin SDK Initialized Successfully.");
    } catch (e) {
        console.error("Failed to parse service account key or initialize Firebase Admin:", e);
        throw new Error("Firebase Admin initialization failed."); // Prevent function execution
    }
}

// Export the initialized Firestore instance
export const db = admin.firestore();
export default admin; // Export admin if needed for other things (like Timestamps)