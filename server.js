"use strict";
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let User = require('./User');
let Message = require('./Message');

let usersOnline = [], users = {};

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
    console.log("user logging in");
    socket.emit(events.serverEvents, events);
    socket.emit(events.serverUserRequest, socket.id);
    socket.on(events.clientUserData, verifyUser);
    socket.on(events.clientMessageSend, function (message) {
        users[message.from].send(message);
    });
    socket.on("disconnect", function () {
        let user = findUserBySocket(socket.id);
        console.log("User disconnected");
        socket.broadcast.emit(events.serverUserDisconnect, user.data);
        let index = find(usersOnline, "id", user.id);
        usersOnline = usersOnline.slice(index);
    });
}

function verifyUser(clientUser) {
    console.log("verifying user");
    let user;
    if (typeof users[clientUser.id] !== "undefined") {
        user = users[clientUser.id];
    } else {
        console.log("Creating new user", clientUser.name);
        user = new User(send);
        usersOnline.push(user.id);
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
    for(let user in usersOnline) {
        list[usersOnline[user]] = users[usersOnline[user]].data;
    }
    return list;
}

function findUserBySocket(socketId){
    for (let id in users){
        if (users[id].socket.id == socketId){
            return users[id];
        }
    }
    return null;
}

function find(array, parameter, value){
    for (let i = 0; i < array.length; i++){
        if (array[i][parameter] == value){
            return i
        }
    }
}

let mods = {
    "io" : io,
    "users": function() {
        return usersOnline;
    }
};
exports.module = mods;