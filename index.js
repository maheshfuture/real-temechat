import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import cors from 'cors';

const app = express();
app.use(express.json())
app.use(cors())

let chats = []

// API
function send(req, res) {
    let msg = req.body.msg;
    let sender = req.body.sender;
    let receiver = req.body.receiver;
    chats.push({
        "msg": msg, 
        "sender": sender,
        "receiver": receiver,
        "time": new Date(),
        "isSeen": false
    })
    res.send("Sent")
}

function getAllMessages(req, res) {
    let receiver = req.body.receiver;
    let relevantChats = chats.filter(chat => chat.receiver === receiver)
    // TC: O(N)
    res.send(relevantChats);
}

// GET, POST
app.post('/send', send)

app.get('/getAllMessages', getAllMessages)


// Websocket
const server = createServer(app);
const io = new Server(server);

let sessions = {}
let pending_chats = []

function onGetUserId(userId, socket) {
    sessions[userId] = socket.id;
}

function receiveMsg(msg, socket) {
    let receiver = msg.receiver;
    let receiver_session = sessions[receiver];

    // If receiver is not connected, put chat in pending
    if (!receiver_session) pending_chats.push(msg);
    else socket.broadcast.to(receiver_session).emit('message', msg);
}

function onConnect(socket) {
    // Event
    socket.emit('getUserID');
    socket.on('userId', (userId) => onGetUserId(userId, socket));

    // Filter out pending chats of this user and send it
  

    socket.on('receiveMsg', (msg) => receiveMsg(msg, socket))
}

io.on('connect', onConnect)

// port
server.listen(3007)