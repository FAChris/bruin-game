// netlify/functions/get-scores.js
const faunadb = require('faunadb');

// Securely access your Fauna API key from Netlify environment variables
// DO NOT HARDCODE THE KEY HERE!
const faunaSecret = process.env.FAUNA_SERVER_SECRET;
if (!faunaSecret) {
    console.error("Fauna secret not found in environment variables.");
    return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server configuration error." }),
    };
}

const q = faunadb.query;
const client = new faunadb.Client({ secret: faunaSecret });

exports.handler = async (event, context) => {
    console.log("Function 'get-scores' invoked.");

    try {
        const response = await client.query(
            // Paginate retrieves data using an index
            q.Map(
                q.Paginate(
                    q.Match(q.Index('scores_by_score_desc')), // Use the index you created
                    { size: 10 } // Get the top 10 scores (adjust as needed)
                ),
                // For each result [score, level, name, ref], return an object
                q.Lambda(
                    ['score', 'level', 'name', 'ref'], // Match the order defined in the index Values
                    {
                        name: q.Var('name'),
                        score: q.Var('score'),
                        level: q.Var('level'),
                    }
                )
            )
        );

        // The result is nested under 'data'
        const scores = response.data;

        console.log(`${scores.length} scores retrieved successfully.`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*', // Allow requests from any origin (adjust if needed for security)
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
            },
            body: JSON.stringify(scores),
        };
    } catch (error) {
        console.error("Error fetching scores from Fauna:", error);
        return {
            statusCode: 500,
             headers: { // Add headers even for errors for CORS preflight
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, OPTIONS'
             },
            body: JSON.stringify({ error: 'Failed to fetch scores.' }),
        };
    }
};

// Handle OPTIONS request for CORS preflight
exports.handler = async (event, context) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204, // No Content
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' // Add POST here
      },
      body: ''
    };
  }
  // If not OPTIONS, proceed with the GET or POST logic from above/below
  // Combine the GET logic here if doing both in one file,
  // or separate into get-scores.js and save-score.js
   if (event.httpMethod === 'GET') {
       // ... (paste the GET logic from above here) ...
        console.log("Function 'get-scores' invoked.");

        try {
            const response = await client.query(
                q.Map(
                    q.Paginate(
                        q.Match(q.Index('scores_by_score_desc')),
                        { size: 10 }
                    ),
                    q.Lambda(
                        ['score', 'level', 'name', 'ref'],
                        {
                            name: q.Var('name'),
                            score: q.Var('score'),
                            level: q.Var('level'),
                        }
                    )
                )
            );

            const scores = response.data;
            console.log(`${scores.length} scores retrieved successfully.`);

            return {
                statusCode: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                     'Access-Control-Allow-Headers': 'Content-Type', // Needed?
                     'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' // Needed?
                },
                body: JSON.stringify(scores),
            };
        } catch (error) {
            console.error("Error fetching scores from Fauna:", error);
            return {
                statusCode: 500,
                headers: {
                   'Access-Control-Allow-Origin': '*',
                   'Access-Control-Allow-Headers': 'Content-Type', // Needed?
                   'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' // Needed?
                },
                body: JSON.stringify({ error: 'Failed to fetch scores.' }),
            };
        }
   } else {
       // Handle other methods or return error
        return { statusCode: 405, body: 'Method Not Allowed' };
   }
};