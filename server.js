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
    serverUserData2 : "server user data2",
    serverUserConnect: "server user connect",
    serverUserDisconnect: "server use disconnect",
    serverUserList: "server user list",
    serverUserData: "server user data",
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
    let auth = authorize(req.params.email, req.params.pass);
    if (auth["valid"]) {
        let token = jwt.sign(auth["data"], 'super_secret code', {expiresIn: "7d"});
        let response = {
            valid: auth["valid"],
            token: token,
            id: auth["data"].id
        };
        res.json(response);
    } else {
        res.json({valid: auth["valid"], message: auth["data"]});
    }
});

app.post('/register/:email/:pass', function (req,res) {
    log.event('Registering user...');
    // TODO: Create user
    let auth = authorize(req.params.email, req.params.pass);
    if (auth["data"]) {
        let token = jwt.sign(auth["data"], 'super_secret code', {expiresIn: "7d"});
        let response = {
            valid: auth["valid"],
            token: token,
            id: auth["data"].id
        };
        res.json(response);
    } else {
        res.json({valid: auth["valid"], message: auth["data"]});
    }
});

io.on('connection', jwtIO.authorize({
    secret: 'super_secret code',
    timeout: 30000
}));
io.on('authenticated', connectSocket);

function authorize(email, password) {
    // TODO: check userDb for valid login/password
    return {
        valid: true,
        data: {
            "id": null,
            "email": email
        }
    };
}

function connectSocket(socket) {
    let user = {
        id: socket.decoded_token.id,
        email: socket.decoded_token.email,
    }; // willl be user = users[socket.decoded_token.id]
    log.event(user.email+" connected.");
    socket.emit(events.serverEvents, events);
    socket.emit(events.serverUserData, user);
    socket.broadcast.emit(events.serverUserConnect, user);
    socket.on(events.clientMessageSend,  (message) => { users[message.from].send(message); });
    socket.on("disconnect", function () {
        log.event("User " + user.email + " disconnected");
        socket.broadcast.emit(events.serverUserDisconnect, user.data);
        // let index = find(usersOnline, "id", user.id);
        // usersOnline = usersOnline.slice(index);

    });
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
