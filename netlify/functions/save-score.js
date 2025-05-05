const sqlite3 = require('sqlite3').verbose();
const dbPath = '/tmp/leaderboard.db';

const run = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        console.error('Database run error:', err.message);
        reject(err);
        return;
      }
      resolve(this);
    });
  });
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let db;
  try {
    const initializeDatabase = async () => {
      const initDb = new sqlite3.Database(dbPath);
      await run(initDb, `
        CREATE TABLE IF NOT EXISTS scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          score INTEGER NOT NULL,
          level INTEGER NOT NULL,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await new Promise((resolve) => initDb.close(resolve)); // Close after creating
    };

    await initializeDatabase();

    const { name, score, level } = JSON.parse(event.body);
    if (!name || typeof score !== 'number' || typeof level !== 'number') {
      return { statusCode: 400, body: 'Missing or invalid data.' };
    }

    db = new sqlite3.Database(dbPath); // Open again for insert
    const result = await run(db, `INSERT INTO scores (name, score, level) VALUES (?, ?, ?)`, [name, score, level]);
    await new Promise((resolve) => db.close(resolve));

    return { statusCode: 201, body: JSON.stringify({ message: 'Score saved successfully!', scoreId: result.lastID }) };

  } catch (error) {
    console.error('Function error:', error);
    if (db) {
      await new Promise((resolve) => db.close(resolve));
    }
    return { statusCode: 500, body: 'Failed to save score.' };
  }
};