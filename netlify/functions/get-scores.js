// functions/get-scores/get-scores.js
const faunadb = require('faunadb');

// FaunaDB query functions
const q = faunadb.query;

exports.handler = async (event) => {
  // Check if Fauna secret key exists
  if (!process.env.FAUNA_SERVER_SECRET) {
    console.error('FaunaDB secret key not found in environment variables.');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database configuration error.' }),
    };
  }

  // Create FaunaDB client
  const client = new faunadb.Client({
    secret: process.env.FAUNA_SERVER_SECRET,
    // Use the correct domain for your Fauna region if not Classic
    // domain: 'db.us.fauna.com', // or 'db.eu.fauna.com', 'db.classic.fauna.com'
    // scheme: 'https', // Use https
  });

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Query FaunaDB using the index to get top 10 scores
    // The index 'scores_sort_by_score_level_desc' returns values in the format:
    // [score, level, name]
    const result = await client.query(
      q.Map(
        q.Paginate(
          q.Match(q.Index('scores_sort_by_score_level_desc')), // Match all entries in the index
          { size: 10 } // Limit to top 10
        ),
        q.Lambda(['score', 'level', 'name'], { // Define variables for the values returned by the index
          name: q.Var('name'),
          score: q.Var('score'),
          level: q.Var('level'),
        })
      )
    );

    // The result is { data: [ { name: ..., score: ..., level: ... }, ... ] }
    console.log(`Successfully fetched ${result.data.length} scores.`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(result.data), // Return the array of score objects
    };

  } catch (error) {
    console.error('Error fetching scores from FaunaDB:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch scores.' }),
    };
  }
};