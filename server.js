const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON
app.use(express.json());

// Serve static files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// Connect to SQLite database
const db = new sqlite3.Database('./todos.db');

// Create todos table if it doesn't exist
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    priority TEXT DEFAULT 'low',
    isComplete BOOLEAN DEFAULT 0,
    isFun BOOLEAN DEFAULT 0
  )`);
});

// Serve index.html at the root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GET all todo items
app.get('/todos', (req, res) => {
  db.all('SELECT * FROM todos', (err, rows) => {
    if (err) {
      res.status(500).json({ message: 'Database error' });
    } else {
      res.json(rows);
    }
  });
});

// GET a specific todo item by ID
app.get('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.get('SELECT * FROM todos WHERE id = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ message: 'Database error' });
    } else if (!row) {
      res.status(404).json({ message: 'Todo item not found' });
    } else {
      res.json(row);
    }
  });
});

// POST a new todo item
app.post('/todos', (req, res) => {
  const { name, priority = 'low', isFun = false } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Name is required' });
  }

  db.run(
    'INSERT INTO todos (name, priority, isComplete, isFun) VALUES (?, ?, ?, ?)',
    [name, priority, 0, isFun ? 1 : 0],
    function(err) {
      if (err) {
        res.status(500).json({ message: 'Database error' });
      } else {
        res.status(201).json({
          id: this.lastID,
          name,
          priority,
          isComplete: 0,
          isFun: isFun ? 1 : 0
        });
      }
    }
  );
});

// DELETE a todo item
app.delete('/todos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.run('DELETE FROM todos WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ message: 'Database error' });
    } else if (this.changes === 0) {
      res.status(404).json({ message: 'Todo item not found' });
    } else {
      res.json({ message: 'Todo item deleted successfully' });
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});