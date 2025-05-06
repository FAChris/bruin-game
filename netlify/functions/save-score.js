// netlify/functions/save-score.js
const faunadb = require('faunadb');

const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
    console.error("Fauna secret not found.");
    return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error." }),
    };
}

const q = faunadb.query;
const client = new faunadb.Client({ secret: faunaSecret });

// Basic input validation function (enhance as needed)
function isValidScoreData(data) {
    if (!data || typeof data !== 'object') return false;
    const { name, score, level } = data;

    // Name: string, not empty, reasonable length
    if (typeof name !== 'string' || name.trim().length === 0 || name.length > 25) {
         console.warn("Validation failed: Invalid name", name);
         return false;
    }
    // Score: positive integer, reasonable max (e.g., less than 1 million?)
    if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > 999999) {
         console.warn("Validation failed: Invalid score", score);
        return false;
    }
    // Level: positive integer, reasonable max (e.g., less than 100?)
    if (typeof level !== 'number' || !Number.isInteger(level) || level <= 0 || level > 99) {
         console.warn("Validation failed: Invalid level", level);
        return false;
    }

    // Add more checks? Profanity filter for name? Check against impossible score progression?
    return true;
}

// Sanitize name slightly more (still basic)
function sanitizeName(name) {
   return name.replace(/[^a-zA-Z0-9 _-]/g, '').trim().substring(0, 15); // Allow letters, numbers, space, underscore, hyphen
}


exports.handler = async (event, context) => {
  // Handle CORS Preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': '*', // Adjust for production
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS' // Allow POST and OPTIONS
      },
      body: ''
    };
  }

  // Handle POST request
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      headers: { 'Allow': 'POST, OPTIONS' },
      body: 'Method Not Allowed'
    };
  }

  console.log("Function 'save-score' invoked.");

  let scoreData;
  try {
      scoreData = JSON.parse(event.body);
      console.log("Received data:", scoreData);
  } catch (error) {
      console.error("Error parsing request body:", error);
      return {
          statusCode: 400, // Bad Request
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Invalid request body. Expected JSON.' }),
      };
  }

  // --- SERVER-SIDE VALIDATION ---
  if (!isValidScoreData(scoreData)) {
      console.warn("Invalid score data received:", scoreData);
      return {
          statusCode: 400, // Bad Request
           headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Invalid score data provided.' }),
      };
  }

  // Sanitize name after validation passes basic checks
  const cleanName = sanitizeName(scoreData.name);
  const scoreToSave = {
      name: cleanName,
      score: scoreData.score,
      level: scoreData.level,
      // You could add a timestamp too:
      // createdAt: q.Now()
  };

  console.log("Attempting to save validated data:", scoreToSave);

  try {
      // --- Logic to potentially update existing score ---
      // 1. Try to find an existing entry for this player name
      // Note: This requires an index on the 'name' field for efficiency.
      // Let's create one quickly: Go to Fauna -> Indexes -> New Index
      // Name: `leaderboard_by_name`, Source Collection: `leaderboard`, Terms: `data.name` (Unique checked recommended), Values: `ref`
      const existingEntry = await client.query(
          q.Map(
              q.Paginate(q.Match(q.Index('leaderboard_by_name'), scoreToSave.name)),
              q.Lambda('ref', q.Get(q.Var('ref')))
          )
      ).catch(err => {
         // If index doesn't exist or other error, log it but maybe proceed to create
         console.warn("Could not check for existing entry by name (maybe index missing?):", err.message);
         return null; // Indicate we couldn't check reliably
      });


      let savedEntry;
      // Check if we found *exactly one* existing entry
      if (existingEntry && existingEntry.data && existingEntry.data.length === 1) {
          const docRef = existingEntry.data[0].ref;
          const currentData = existingEntry.data[0].data;
          console.log(`Found existing entry for ${scoreToSave.name} with score ${currentData.score}, level ${currentData.level}`);

          // Only update if the new score is better (higher score, or same score & higher level)
          if (scoreToSave.score > currentData.score || (scoreToSave.score === currentData.score && scoreToSave.level > currentData.level)) {
              console.log("New score is better. Updating...");
              savedEntry = await client.query(
                  q.Update(docRef, { data: scoreToSave })
              );
          } else {
              console.log("New score is not better. Skipping update.");
              savedEntry = existingEntry.data[0]; // Return the existing data as if saved
          }
      } else {
           if (existingEntry && existingEntry.data && existingEntry.data.length > 1) {
              console.warn(`Found multiple entries for player ${scoreToSave.name}. This shouldn't happen with a unique index. Saving as new.`);
           } else {
               console.log(`No existing entry found for ${scoreToSave.name}. Creating new one.`);
           }
           // Create a new entry if none found or check failed
          savedEntry = await client.query(
              q.Create(q.Collection('leaderboard'), { data: scoreToSave })
          );
      }

      console.log("Score saved/updated successfully:", savedEntry.ref.id);

      return {
          statusCode: 200, // Or 201 Created if you distinguish
          headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*' // Adjust for production
          },
          body: JSON.stringify({ success: true, id: savedEntry.ref.id }),
      };
  } catch (error) {
      console.error("Error saving score to Fauna:", error);
      // Check for specific Fauna errors if needed (e.g., unique constraint violation)
      return {
          statusCode: 500,
           headers: { 'Access-Control-Allow-Origin': '*' },
          body: JSON.stringify({ error: 'Failed to save score.' }),
      };
  }
};