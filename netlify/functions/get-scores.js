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

const all = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        console.error('Database all error:', err.message);
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
};

const get = (db, query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error('Database get error:', err.message);
        reject(err);
        return;
      }
      resolve(row);
    });
  });
};

const initializeDatabase = async (db) => {
  await run(db, `
    CREATE TABLE IF NOT EXISTS scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      score INTEGER NOT NULL,
      level INTEGER NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let db;
  try {
    db = new sqlite3.Database(dbPath);
    await initializeDatabase(db);
    const scores = await all(db, `SELECT name, score, level FROM scores ORDER BY score DESC, level DESC LIMIT 10`);
    return { statusCode: 200, body: JSON.stringify(scores) };
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, body: 'Internal Server Error' };
  } finally {
    if (db) {
      await new Promise((resolve) => db.close(resolve));
    }
  }
};