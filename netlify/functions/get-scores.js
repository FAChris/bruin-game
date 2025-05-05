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
  `, callback);
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    await new Promise((resolve, reject) => {
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='scores'", (err, row) => {
        if (err) {
          console.error('Error checking for scores table:', err.message);
          reject(err);
        }
        if (!row) {
          console.log('Scores table does not exist, creating it.');
          initializeDatabase((err) => {
            if (err) {
              console.error('Error creating scores table:', err.message);
              reject(err);
            } else {
              resolve();
            }
          });
        } else {
          resolve();
        }
      });
    });

    const scores = await new Promise((resolve, reject) => {
      db.all(`SELECT name, score, level FROM scores ORDER BY score DESC, level DESC LIMIT 10`, [], (err, rows) => {
        if (err) {
          console.error('Error fetching scores:', err.message);
          reject({ statusCode: 500, body: 'Failed to retrieve leaderboard data.' });
        } else {
          resolve(rows);
        }
      });
    });

    // Close the database connection AFTER all operations
    await new Promise((resolve) => db.close(resolve));

    return {
      statusCode: 200,
      body: JSON.stringify(scores),
    };

  } catch (error) {
    console.error('Function error:', error);
    // Ensure database is closed even in case of an error
    await new Promise((resolve) => db.close(resolve));
    return { statusCode: 500, body: 'Internal Server Error' };
  }
};