"use strict";
let fs = require('fs');
let bcrypt = require('bcrypt-nodejs');
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
let Log = require('./Log'),
    User = require('./User'),
    Message = require('./Message'),
    Conversation = require('./Conversation');

let config = {
    serverPort: 443,
    logLevel: "high"
};
let usersOnline = {}, users = {};
let events = {
    serverEvents: "server events",
    serverUserConnect: "server user connect",
    serverUserDisconnect: "server use disconnect",
    serverUserList: "server user list",
    serverUserData: "server user data",
    serverMessageReceive: "server message receive",
    serverConversationData: "server conversation data",
    clientMessageSend: "client message send",
    clientUserData: "client user data",
    clientConversationCreate: "client conversation create",
    clientUserList: "client user list",
    clientUserFriendAdd: "client user friend add"
};

let db = require('./Database');
let log = new Log(config.logLevel);

http.listen(config.serverPort, function() {
    log.event('HTTPS server started. Listening on port ' + config.serverPort);
    populateUsers();
});


app.use(express.static(__dirname + '/public'));

app.post('/login/:email/:pass', function (req,res) {
    log.event('Authorizing user...');

    authorize({email: req.params.email, password: req.params.pass}).then((auth) => {
        if (auth.valid) {
            auth.data = users[auth.id].data;
            auth.token = jwt.sign(auth.data, 'super_secret code', {expiresIn: "7d"});
            log.event('Authorization successful.');
        }
        res.json(auth);
    });
});

app.post('/register/:email/:pass', function (req,res) {
    log.event('Registering user...');
    new Promise((resolve, reject) => {
        bcrypt.genSalt(10, function (err, salt) {
            bcrypt.hash(req.params.pass, salt, null, function (err, hash) {
                let user = new User(send);
                user.email = req.params.email;
                db.createUser(user).then(() => {
                    db.createNewPassword(user.id, salt, hash).then(() => {
                        users[user.id] = user;
                        resolve({email: req.params.email, password: req.params.pass});
                    });
                });

            });
        });
    })
    .then(authorize)
    .then((auth) => {
        if (auth.valid) {
            auth.data = users[auth.id].data;
            auth.token = jwt.sign(auth.data, 'super_secret code', {expiresIn: "7d"});
        }
        log.recurrent("Authorization status " + auth.valid);
        log.debug(auth.data);
        auth.userList = createUserList();
        res.json(auth);

    });
});

io.on('connection', jwtIO.authorize({
    secret: 'super_secret code',
    timeout: 30000
}));

io.on('authenticated', connectSocket);

function populateUsers() {
    return new Promise ((res, rej) => {
        db.getAllUsers().then((userList) => {
            userList.forEach((data) => {
                let user = new User(send, data);
                users[user.id] = user;

            });
            res();
        });
    });

}

function authorize(data) {
    return new Promise((resolve, reject) => {
        db.findIdByEmail(data.email).then(db.getPassword.bind(db)).then((userPWData) => {
            log.debug("Password lookup result");
            log.debug(userPWData);
            if (userPWData) {
                bcrypt.compare(data.password, userPWData.password_hash, (err, res) => {
                    if (res) {
                        log.event("User authorized");
                        resolve({valid: true, id: userPWData.id})
                    } else {
                        resolve({valid: false, data: "Password doesn't match."})
                    }
                });
            } else {
                resolve({valid: false, data: "User not found."});
            }
        });
    })
}

function connectSocket(socket) {
    let user = users[socket.decoded_token.id];
    usersOnline[user.id] = user.data;
    user.socket = socket;
    log.event(user.email+" connected.");
    socket.emit(events.serverEvents, events);
    socket.emit(events.serverUserData, user.data);
    socket.broadcast.emit(events.serverUserConnect, user.data);
    socket.on(events.clientMessageSend,  (message) => { users[message.from].send(message); });
    socket.on(events.clientConversationCreate, createConversation);
    socket.on("disconnect", function () {
        log.event("User " + user.email + " disconnected");
        socket.broadcast.emit(events.serverUserDisconnect, user.data);
        delete usersOnline[user.id];
    });

}

function createConversation(conversationRequest){
    let conversation = null;
    db.findConversationId(conversationRequest.users)
        .then((existingId) => {
            if (existingId){
                conversation = db.getConversationById(existingId);
            } else {
                db.createConversation(id, conversationRequest.users);
            }
        })
        .then(() => users[conversationRequest.userId].socket.emit(id));
}

function send(message){
    log.message(users[message.from].email + " > " + users[message.conversationId].email);
    db.getConversationById(message.conversationId)
        .then((row) => {
        for (let user in row.users){
            user.receive(message);
        }
        db.createMessage(message);
    });
}

function createUserList() {
    let list = {};
    for(var id in users) {
        list[id] = users[id].data;
    }
    return list;

}