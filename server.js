"use strict";
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let User = require('./User');
let Message = require('./Message');

let users = {}, user = {};

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

http.listen(8888, function() {
    console.log('listening on *:8888');
});

io.on("connect", connectSocket);

function connectSocket(socket) {
    socket.emit(events.serverEvents, events);
    socket.emit(events.serverUserRequest, socket.id);
    socket.on(events.clientUserData, verifyUser);
    socket.on(events.clientMessageSend, function (message) {
        users[user.id].send(message);
    });
    socket.on("disconnect", function () {
        console.log("User", user.name, "disconnected");
        socket.broadcast.emit(events.serverUserDisconnect, user.data);
        delete users[user.id];
    });
}

function verifyUser(clientUser) {
    console.log("Verifying user...");
    console.log(clientUser);
    if (typeof users[clientUser.id] !== "undefined") {
        user = users[clientUser.id];
    } else {
        user = new User(send);
        users[user.id] = user;
    }
    user.socket = io.sockets.sockets[clientUser.socketId];
    user.name = clientUser.name;
    user.socket.broadcast.emit(events.serverUserConnect, user.data);
    user.socket.emit(events.serverUserData, user.data);
    user.socket.emit(events.serverUserList, userList());
}

function send(message){
    let to = users[message.to];
    to.receive(message);
}

function userList() {
    var list = {};
    for(var id in users) {
        list[users[id].id] = users[id].data;
    }
    console.log(list);
    return list;
}


let mods = {
    "io" : io,
    "users": function() {
        return users;
    }
};
exports.module = mods;