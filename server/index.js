const Database = require("better-sqlite3");
const path = require("path");

// Connect to SQLite (creates the file if it doesn't exist)
const db = new Database(path.join(__dirname, "chat.db"));
db.pragma("journal_mode = WAL"); // Better performance for concurrent reads

// Create the messages table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author TEXT NOT NULL,
    text TEXT NOT NULL,
    time TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log("Connected to SQLite database");

// Prepare reusable statements
const insertMessage = db.prepare(
  "INSERT INTO messages (author, text, time) VALUES (@author, @text, @time)"
);
const getAllMessages = db.prepare(
  "SELECT author, text, time, timestamp FROM messages ORDER BY timestamp ASC"
);

const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// Middleware
app.use(cors());

// Create the HTTP server
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173", 
      "https://chat-app-zeta-self.vercel.app"
    ],
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 1. Fetch and send previous messages to the newly connected user
  try {
    const previousMessages = getAllMessages.all();
    socket.emit("previous_messages", previousMessages);
  } catch (err) {
    console.log(err);
  }

  // 2. Listen for 'send_message'
  socket.on("send_message", (data) => {
    // Save to SQLite
    insertMessage.run({
      author: data.author,
      text: data.text,
      time: data.time,
    });

    // Broadcast the message
    io.emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// Gracefully close the database on exit
process.on("SIGINT", () => {
  db.close();
  process.exit(0);
});

// Start server
const PORT = 3001;
server.listen(PORT, () => {
  console.log(`SERVER IS RUNNING ON PORT ${PORT}`);
});