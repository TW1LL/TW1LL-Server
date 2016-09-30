"use strict";
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let User = require('./User');
let Message = require('./Message');

let users = {}, user = {};

app.use(express.static(__dirname + '/public'));

http.listen(8888, function() {
    console.log('listening on *:8888');
});

io.on("connect", connectSocket);

function connectSocket(socket) {
    socket.emit("server user request", socket.id);
    socket.on("client user data", verifyUser);
    socket.on("client message send", function (message) {
        users[user.id].send(message);
    });
    socket.on("disconnect", function () {
        console.log("User", user.id, "disconnected");
        socket.broadcast.emit("server user disconnect", user.data);
        delete users[user.id];
    });
}

function verifyUser(clientUser) {
    console.log("Verifying user...");
    if (typeof users[clientUser.id] !== "undefined") {
        user = users[clientUser.id];
    } else {
        user = new User(send);
        users[user.id] = user;
    }
    user.socket = io.sockets.sockets[clientUser.socketId];
    user.name = clientUser.name;
    user.socket.broadcast.emit("server user connected", user.data);
    user.socket.emit("server user data", user.data);
    user.socket.emit("server user list", userList());
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
