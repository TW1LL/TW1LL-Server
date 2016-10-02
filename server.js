"use strict";
let fs = require('fs');
let express = require('express');
let app = express();
let jwt = require('jsonwebtoken');
let jwtIO = require('socketio-jwt');
let options = {
    key: fs.readFileSync('./https/file.pem'),
    cert: fs.readFileSync('./https/file.crt')
};
let http = require('https').createServer(options, app);
let io = require('socket.io')(http);
let Log = require('./Log');
let User = require('./User');
let Message = require('./Message');
let db = require('./Database');
let usersOnline = [], users = {};

let config = {
    serverPort: 443,
    logLevel: "high",
};
let log = new Log(config.logLevel);
let events = {
    serverEvents: "server events",
    serverUserData : "server user data",
    serverUserConnect: "server user connect",
    serverUserDisconnect: "server use disconnect",
    serverUserList: "server user list",
    serverUserRequest: "server user request",
    serverMessageReceive: "server message receive",
    clientMessageSend: "client message send",
    clientUserData: "clientUserData"
};

app.use(express.static(__dirname + '/public'));

http.listen(config.serverPort, function() {
    log.event('HTTPS server started. Listening on port ' + config.serverPort);
});

app.post('/login/:email/:pass', function (req,res) {
    log.event('Authorizing user...');
    // TODO: check userDb for valid login/password
    let profile = { // TODO: will be response from Db
        "email": req.params.email
    };
    let token = jwt.sign(profile, 'super_secret code', { expiresIn: "2 days"});
    res.json({token: token});
});

io.use(jwtIO.authorize({
    secret: 'super_secret code',
    handshake: true
}));

io.on("connect", connectSocket);

function connectSocket(socket) {
    log.event(socket.decoded_token.email +" connected.");
    socket.emit(events.serverEvents, events);
    socket.emit(events.serverUserRequest, socket.id);
    socket.on(events.clientUserData, verifyUser);
    socket.on(events.clientMessageSend, function (message) {
        users[message.from].send(message);
    });
    socket.on("disconnect", function () {
        let user = findUserBySocket(socket.id);
        log.event("User "+user.email+" disconnected");
        socket.broadcast.emit(events.serverUserDisconnect, user.data);
        let index = find(usersOnline, "id", user.id);
        usersOnline = usersOnline.slice(index);
    });
}

function verifyUser(clientUser) {
    log.event("Verifying user...");
    let user;
    if (typeof users[clientUser.id] !== "undefined") {
        log.event("User verified.");
        user = users[clientUser.id];
    } else {
        log.event("No user found, creating new user ", clientUser.email);
        user = new User(send);
        usersOnline.push(user.id);
        users[user.id] = user;
    }
    user.socket = io.sockets.sockets[clientUser.socketId];
    user.email = clientUser.email;
    user.socket.broadcast.emit(events.serverUserConnect, user.data);
    user.socket.emit(events.serverUserData, user.data);
    user.socket.emit(events.serverUserList, userList());
}

function send(message){
    log.recurrent(" MSG >> " + users[message.from].email + " > " + users[message.to].email);
    let to = users[message.to];
    to.receive(message);
}

function userList() {
    var list = {};
    for(let user in usersOnline) {
        list[usersOnline[user]] = users[usersOnline[user]].data;
    }
    log.event("Generating new user list with " + Object.keys(list).length + " users");
    return list;
}

function findUserBySocket(socketId){
    log.event("Attempting to find user by socket...");
    for (let id in users){
        if (users[id].socket.id == socketId){
            log.event("user found");
            return users[id];
        }
    }
    log.event("user not found");
    return null;
}

function find(array, parameter, value){
    for (let i = 0; i < array.length; i++){
        if (array[i][parameter] == value){
            return i
        }
    }
}
