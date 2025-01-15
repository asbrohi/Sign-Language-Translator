// server/server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Change port to 5001 to avoid conflict with index.js on 5000
const PORT = process.env.SOCKET_PORT || 5001;

const io = socketIo(server, {
  cors: {
    origin: '*', // For development. Specify your frontend URL in production for security.
    methods: ['GET', 'POST'],
  },
});

// Store users in each room
const rooms = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join', (room) => {
    socket.join(room);
    console.log(`Socket ${socket.id} joined room ${room}`);

    // Add socket to the room
    if (!rooms[room]) {
      rooms[room] = [];
    }
    rooms[room].push(socket.id);

    // Notify existing users about the new user
    socket.to(room).emit('user-joined', socket.id);

    // Send the existing users' IDs to the new user
    const otherUsers = rooms[room].filter(id => id !== socket.id);
    if (otherUsers.length > 0) {
      socket.emit('other-users', otherUsers);
    }
  });

  // Handle offer
  socket.on('offer', (data) => {
    console.log('Sending offer from', socket.id, 'to', data.target);
    socket.to(data.target).emit('offer', {
      sdp: data.sdp,
      caller: socket.id,
    });
  });

  // Handle answer
  socket.on('answer', (data) => {
    console.log('Sending answer from', socket.id, 'to', data.target);
    socket.to(data.target).emit('answer', {
      sdp: data.sdp,
      caller: socket.id,
    });
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (data) => {
    console.log('Sending ICE candidate from', socket.id, 'to', data.target);
    socket.to(data.target).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id,
    });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    // Remove user from rooms
    for (const room in rooms) {
      if (rooms[room].includes(socket.id)) {
        rooms[room] = rooms[room].filter(id => id !== socket.id);
        // Notify others in the room
        socket.to(room).emit('user-disconnected', socket.id);
        // Clean up empty rooms
        if (rooms[room].length === 0) {
          delete rooms[room];
        }
      }
    }
  });
});

// Start the server on the new port
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please use a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
  }
});
