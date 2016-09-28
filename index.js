/**
 * Created by wwagner on 9/28/2016.
 */

var app = require('express')();
var http = require('http').Server(app);
var socket = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendfile('index.html');
});

socket.on('connection', function(socket){
    console.log('a user connected');
    socket.on('chat message', function(msg){
        console.log('message:', msg);
    });
    socket.on('disconnect', function() {
        console.log('user disconnected');
    })
});

http.listen(8888, function() {
    console.log('listening on *:8888');
});