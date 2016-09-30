"use strict";
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let User = require('./User');
let Message = require('./Message');

let users = {};

app.use(express.static(__dirname + '/public'));

http.listen(8888, function() {
    console.log('listening on *:8888');
});

io.on("connect", connectSocket);

function connectSocket(socket){
    socket.emit("server user request", socket.id);
    socket.on("client user data", verifyUser);
    user = new User(socket, send);
    users[user.id] = user;
    user.socket.emit("server user data", user.data);
    user.socket.emit("server user list", userList());
    user.socket.on("client message send", function (message) {
        users[user.id].send(message);
    });
    user.socket.on("client user name", function(name) {
        users[user.id].name = name;
        user.socket.emit("user data", user.data);
        user.socket.broadcast.emit("server user new", user.data);
    });
    user.socket.on("disconnect", function() {
        console.log("User", user.id, "disconnected");
        user.socket.broadcast.emit("server user disconnect", user.data);
        delete users[user.id];
    });

}

function verifyUser(clientUser) {
    if (typeof users[clientUser.id] !== "undefined") {
        user = users[clientUser.id];
        user.socket = io.sockets[clientUser.socketId];
    }
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
    return list;
}


let mods = {
    "io" : io,
    "users": function() {
        return users;
    }
};
exports.module = mods;
