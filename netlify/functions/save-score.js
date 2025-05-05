const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(process.env.LAMBDA_TASK_ROOT + '/leaderboard.db');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { name, score, level } = JSON.parse(event.body);
    if (!name || typeof score !== 'number' || typeof level !== 'number') {
      return { statusCode: 400, body: 'Missing or invalid data.' };
    }

    await new Promise((resolve, reject) => {
      db.run(`INSERT INTO scores (name, score, level) VALUES (?, ?, ?)`, [name, score, level], function(err) {
        if (err) {
          console.error('Error saving score:', err.message);
          reject({ statusCode: 500, body: 'Failed to save score.' });
        } else {
          resolve({ statusCode: 201, body: JSON.stringify({ message: 'Score saved successfully!', scoreId: this.lastID }) });
        }
      });
    });

    const result = await new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          console.error('Database close error:', err.message);
          reject({ statusCode: 500, body: 'Error closing database.' });
        } else {
          resolve();
        }
      });
    });

    return result;

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};