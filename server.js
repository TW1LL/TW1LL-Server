"use strict";
let express = require('express');
let app = express();
let http = require('http').Server(app);
let io = require('socket.io')(http);
let User = require('./User');
let Message = require('./Message');

let users = {};

app.use(express.static('public'));

http.listen(8888, function() {
    console.log('listening on *:8888');
});

io.on("connect", connectSocket);

function connectSocket(socket){
    let user = new User(socket, send);
    users[user.id] = user;
    user.socket.emit("user data", user.data);
    user.socket.emit("user list", userList());
    user.socket.on("message send", function (message) {
        users[user.id].send(message);
    });
    user.socket.on("user name", function(name) {
        users[user.id].name = name;
        user.socket.emit("user data", user.data);
        user.socket.broadcast.emit("user new", user.data);
    });
    user.socket.on("message receive", function (message) {
        users[user.id].receive(message);
    });
    user.socket.on("disconnect", function() {
        console.log("User", user.id, "disconnected");
        user.socket.broadcast.emit("user disconnect", user.data);
        delete users[user.id];
    });

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
