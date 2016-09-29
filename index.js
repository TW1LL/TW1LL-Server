"use strict";

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let User = require('./User');
let Message = require('./Message');

let users = {};

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

http.listen(8888, function() {
    console.log('listening on *:8888');
});

io.on("connect", connect_socket);

function connect_socket(socket){
    let user = new User(socket, "user");
    users[user.id] = user;
    user.socket.emit("user data", user.data);
    user.socket.emit("user new", user.data);
    user.socket.on("message send", function (message) {
        users[user.id].send(message);
    });
    user.socket.on("message receive", function (message) {
        users[user.id].receive(message);
    });
    user.socket.on("disconnect", function() {
        console.log("User", user.id, "disconnected");
    });

}

let mods = {
    "io" : io,
    "users": users
}
exports.module = mods;
