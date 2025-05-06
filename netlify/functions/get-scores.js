// functions/get-scores/get-scores.js
const faunadb = require('faunadb');
const q = faunadb.query;

exports.handler = async (event) => {
  // ... (secret check, client setup - keep domain/scheme if needed) ...
  const client = new faunadb.Client({ /* ... */ });

  if (event.httpMethod !== 'GET') { /* ... */ }

  try {
    // FQL v10 style query using the index
    // The index returns [score, level, name]
    // We use Map/Lambda still, but ensure structure matches index values
    const result = await client.query(
      q.Map(
        q.Paginate(
          q.Match(q.Index('scores_sort_by_score_level_desc')),
          { size: 10 }
        ),
        q.Lambda(
          ['score', 'level', 'name'], // Matches the order defined in index values
          { // Construct the object we want
            name: q.Var('name'),
            score: q.Var('score'),
            level: q.Var('level'),
          }
        )
      )
    );
    // Check if the result structure is as expected (v10 might differ slightly)
     // The driver should abstract this, result.data is common
    const scores = result.data || [];

    console.log(`Successfully fetched ${scores.length} scores (v10).`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(scores),
    };
  } catch (error) {
    // ... (existing error handling) ...
    console.error('Error fetching scores from FaunaDB (v10 attempt):', error);
     let errorMsg = 'Failed to fetch scores.';
     if (error.requestResult && error.requestResult.responseContent && error.requestResult.responseContent.errors) {
       errorMsg = error.requestResult.responseContent.errors[0].description || errorMsg;
     } else if (error.message) {
       errorMsg = error.message;
     }
     return {
       statusCode: error.requestResult?.statusCode || 500, // Use Fauna status code if available
       body: JSON.stringify({ error: errorMsg }),
     };
  }
};