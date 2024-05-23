const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Initialize SQLite database
const db = new sqlite3.Database('./users.db', (err) => {
    if (err) {
        console.error('Could not connect to database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../public')));

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Middleware to check for valid cookie
function checkCookie(req, res, next) {
    const userCookie = req.cookies.user;

    if (!userCookie) {
        return res.redirect('/');
    }

    const [username, date] = userCookie.split('-');
    const currentDate = new Date();
    const dd = String(currentDate.getDate()).padStart(2, '0');
    const mm = String(currentDate.getMonth() + 1).padStart(2, '0'); // January is 0!
    const yyyy = currentDate.getFullYear();
    const dateString = dd + mm + yyyy;

    const query = `SELECT username FROM users WHERE username = ?`;
    db.get(query, [username], (err, row) => {
        if (err) {
            console.error(err);
            return res.redirect('/');
        }
        if (!row || date !== dateString) {
            return res.redirect('/');
        }
        next();
    });
}

// Handle login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = `SELECT username, password FROM users WHERE username = '${username}'`;
    db.get(query, (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        else if (!row) {
            // No user found
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        else if (row.password !== password) {
            // Incorrect password
            res.status(401).json({ message: 'Invalid password', data: row });
        }
        else {
        const date = new Date();
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = date.getFullYear();
        const dateString = dd + mm + yyyy;

        // Set the cookie
        res.cookie('user', `${username}-${dateString}`, { httpOnly: true });
        res.status(200).json({ message: 'Login successful' });
        }
        
    });
});



// Handle posting a new message
app.post('/add_message', (req, res) => {
    const { message } = req.body;
    const username = req.cookies.user.split('-')[0];
    const query = `INSERT INTO messages (username, message) VALUES (?, ?)`;
    db.run(query, [username, message], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(200).json({ success: true });
    });
});

// Handle loading all messages
app.get('/load_messages', (req, res) => {
    const query = `
        SELECT messages.message, messages.timestamp, users.username
        FROM messages
        INNER JOIN users ON messages.username = users.username
        ORDER BY messages.timestamp DESC
    `;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Error retrieving messages:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.status(200).json(rows);
    });
});


// Serve the main page, with cookie check middleware
app.get('/main', checkCookie, (req, res) => {
    res.sendFile(path.join(__dirname, '../public/main.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
