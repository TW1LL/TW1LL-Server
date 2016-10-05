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
    serverUserFriendsList: "server send friends list",
    serverMessageReceive: "server message receive",
    serverConversationData: "server conversation data",
    clientMessageSend: "client message send",
    clientUserData: "client user data",
    clientConversationCreate: "client conversation create",
    clientUserList: "client user list",
    clientUserFriendAdd: "client user friend add",
    clientUserFriendRemove: "client user friend remove",
    clientConversationSync: "client conversation sync",
};

let db = require('./db/Database');
let log = new Log(config.logLevel);

http.listen(config.serverPort, function() {
    log.event('HTTPS server started. Listening on port ' + config.serverPort);
    populateUsers();
});

app.use(express.static(__dirname + '/public'));

app.post('/login/:email/:pass', function (req,res) {
    log.event('Authorizing user...');

    db.User.authorize({email: req.params.email, password: req.params.pass}).then((auth) => {
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
    let user = new User(send);
    db.User.register(user, req.params)
    .then(db.User.authorize.bind(db.User))
    .then((auth) => {
        if (auth.valid) {
            users[user.id] = user;
            auth.data = user.data;
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
    return new Promise ((resolve) => {
        db.User.getAll().then((userList) => {
            userList.forEach((data) => {
                let user = new User(send, data);
                users[user.id] = user;

            });
            resolve();
        });
    });
}

function connectSocket(socket) {
    let user = users[socket.decoded_token.id];
    usersOnline[user.id] = user.data;
    user.socket = socket;
    log.event(user.email+" connected.");
    socket.emit(events.serverEvents, events);
    socket.emit(events.serverUserData, sendUserData(user));
    socket.broadcast.emit(events.serverUserConnect, user.data);
    socket.on(events.clientConversationSync, syncConversations);
    socket.on(events.clientUserFriendAdd, addFriends);
    socket.on(events.clientMessageSend,  (message) => { users[message.from].send(message); });
    socket.on(events.clientConversationCreate, createConversation);)
    socket.on("disconnect", function () {
        log.event("User " + user.email + " disconnected");
        socket.broadcast.emit(events.serverUserDisconnect, user.data);
        delete usersOnline[user.id];
    });
}

function createConversation(conversationRequest){
    let conversation = null;
    db.Conversation.findIdByMembers(conversationRequest.users)
        .then((existingId) => {
            if (existingId){
                conversation = db.Conversation.getById(existingId);
            } else {
                db.Conversation.create(id, conversationRequest.users);
            }
        })
        .then(() => users[conversationRequest.userId].socket.emit(id));
}

function send(message){
    log.message(users[message.from].email + " > " + users[message.conversationId].email);
    db.Conversation.getById(message.conversationId)
        .then((row) => {
        for (let user in row.users){
            user.receive(message);
        }
        db.Message.create(message);
    });
}

function sendUserData(user) {
    let data = {};
    data.userData = user.data;
    data.friendsList = createFriendsList(user);


    return data;


}


function createUserList() {
    let list = {};
    for(var id in users) {
        list[id] = users[id].data;
    }
    return list;
}

function createFriendsList(user) {
    let list = {};
    for(let id in user.friends) {
        let user = users[user.friends[id]];
        list[user.id] = user.data;
    }
    return list;
}

function addFriends(data){
    let user = users[data.id];
    let friends = user.friends;
    data.friends.forEach((friend) => {
        if (!friends.includes(friend)) {
            user.addFriend(friend);
        }
    });
    user.socket.emit(events.serverUserFriendsList, createFriendsList(user));
}

function syncConversations(conversations) {
    let userId = conversations[0];
    let clientConversations = conversations[1];
    // get conversations from
    let serverConversations = users[userId].conversations;
    let missingConversations = {};
    for (let conversationId in serverConversations) {
        if (conversationId in clientConversations) {
            let clientMessages = clientConversations[conversationId];
            for (let message in serverConversations[conversationId]){
                if (!clientMessages.contains(message)){
                    missingConversations[conversationId] = serverConversations[conversationId];
                    break;
                }
            }
        } else {
            missingConversations[conversationId] = serverConversations[conversationId];
        }
    }
}