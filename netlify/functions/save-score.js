// functions/save-score/save-score.js
const faunadb = require('faunadb');
const q = faunadb.query;

exports.handler = async (event) => {
   // ... (secret check, client setup - keep domain/scheme if needed) ...
   const client = new faunadb.Client({ /* ... */ });

   if (event.httpMethod !== 'POST') { /* ... */ }

   try {
     // ... (parse and validate name, score, level) ...
     const { name, score, level } = JSON.parse(event.body);
     // ... validation code ...
     const trimmedName = name.trim();

     // FQL v10 style Create
     const result = await client.query(
       q.Create(
         q.Collection('scores'),
         {
           data: { // data wrapper still typically used
             name: trimmedName,
             score: score,
             level: level,
           },
         }
       )
     );

     console.log(`Score saved successfully for ${trimmedName} (v10). Doc ID: ${result.ref.id}`);
     return { /* ... success response ... */ };

   } catch (error) {
     // ... (existing error handling, check status code) ...
      console.error('Error saving score to FaunaDB (v10 attempt):', error);
     let errorMsg = 'Failed to save score.';
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