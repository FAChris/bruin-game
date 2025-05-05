// In netlify/functions/save-score.js

const sqlite3 = require('sqlite3').verbose();
const dbPath = '/tmp/leaderboard.db';
const db = new sqlite3.Database(dbPath);

const initializeDatabase = (callback) => {
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      level INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, callback); // Execute the callback when done
};

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
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='scores'", (err, row) => {
        if (err) {
          console.error('Error checking for scores table:', err.message);
          reject(err);
        }
        if (!row) {
          console.log('Scores table does not exist, creating it.');
          initializeDatabase((err) => { // Call initialize and wait for it to complete
            if (err) {
              console.error('Error creating scores table:', err.message);
              reject(err);
            } else {
              resolve(); // Proceed after table creation
            }
          });
        } else {
          resolve(); // Table exists, proceed
        }
      });
    });

    // Now, insert the score
    const result = await new Promise((resolve, reject) => {
      db.run(`INSERT INTO scores (name, score, level) VALUES (?, ?, ?)`, [name, score, level], function(err) {
        if (err) {
          console.error('Error saving score:', err.message);
          reject({ statusCode: 500, body: 'Failed to save score.' });
        } else {
          resolve({ statusCode: 201, body: JSON.stringify({ message: 'Score saved successfully!', scoreId: this.lastID }) });
        }
      });
    });

    await new Promise((resolve) => db.close(resolve)); // Close the database

    return result;

  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};