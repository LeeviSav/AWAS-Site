const sqlite3 = require('sqlite3').verbose();

// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// Create the users table and insert a sample user
db.serialize(() => {
    db.run(`
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`, (err) => {
    if (err) {
        console.error('Could not create messages table', err);
    } else {
        console.log('Messages table created or already exists');
    }
});
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Could not create table', err);
        } else {
            console.log('Users table created or already exists');

            const username = 'SLeevi';
            const password = 'Metropolia123';
            db.close((err) => {
                if (err) {
                    console.error('Error closing the database', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        }
    });
});
