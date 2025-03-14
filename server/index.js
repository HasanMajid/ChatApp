const express = require("express");
const app = express();
const { randomUUID } = require('crypto');
const cors = require("cors");
const WebSocket = require("ws");
app.use(cors());

// const server = http.createServer(app);
// var env = process.env.NODE_ENV || "development";

const wss = new WebSocket.Server({ port: 8080 });

const leave = (room, ID) => {
  console.log("leaving room", room, ID);
  // not present: do nothing
  if (!rooms[room]) return;

  // if the one exiting is the last one, destroy the room
  if (Object.keys(rooms[room]).length === 1) delete rooms[room];
  // otherwise simply leave the room
  else {
    rooms[room] = rooms[room].filter((ws) => ws.ID !== ID);
  }
  console.log("new rooms", rooms);
};

const rooms = {};
wss.on("connection", (ws) => {
  console.log("Client connected");
  ID = randomUUID();
  ws.ID = ID;
  console.log(ID);

  ws.on("message", (data) => {
    data = JSON.parse(data);
    const { message, meta, room } = data;
    console.log(data);

    if (meta == "join_room"){
      rooms[room] = rooms[room] ? [...rooms[room], ws] : [ws];
      console.log(`User with ID: ${ws} joined room: ${room}`);
      ws.send(JSON.stringify({meta: 'joined_room', room}));
    }
  
    if (meta == "send_message" && message){
      Object.entries(rooms[room]).forEach(([, sock]) => sock.send(JSON.stringify({ message , meta: 'room_message', room })));
    }

    if (meta == "leave_room"){
      console.log(`User with ID: ${ID} left room: ${room}`);
      Object.keys(rooms).forEach(room => leave(room, ws.ID));
    }
  });



  ws.on("close", () => {
    console.log("Client disconnected", rooms);
  });
});