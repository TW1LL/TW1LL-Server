"use strict";
let fs = require('fs');
let express = require('express');
let app = express();
let jwtIO = require('socketio-jwt');
let options = {
    key: fs.readFileSync('./https/file.pem'),
    cert: fs.readFileSync('./https/file.crt')
};
let http = require('https').createServer(options, app);
let io = require('socket.io')(http);
let Log = require('./Log'),
    User = require('./Models/User'),
    Message = require('./Models/Message'),
    Conversation = require('./Models/Conversation');

let config = {
    serverPort: 443,
    logLevel: "high"
};

let db = require('./db/Database');
let log = new Log(config.logLevel);

let events = {
    serverEvents: "server events",
    serverUserConnect: "server user connect",
    serverUserDisconnect: "server use disconnect",
    serverUserList: "server user list",
    serverUserData: "server user data",
    serverUserFriendsList: "server send friends list",
    serverMessageSend: "server message send",
    serverConversationData: "server conversation data",
    serverUserLogout: "server user logout",
    clientMessageSend: "client message send",
    clientUserData: "client user data",
    clientConversationCreate: "client conversation create",
    clientUserList: "client user list",
    clientUserFriendAdd: "client user friend add",
    clientUserFriendRemove: "client user friend remove",
    clientConversationSync: "client conversation sync",
    clientRequestConversation: "client request conversation"
};

let usersOnline = {}, users = {};

app.use(express.static(__dirname + '/public'));

db.connect()
    .then((result) => {
        http.listen(config.serverPort,() => {
            log.sys('HTTPS server started. Listening on port ' + config.serverPort);
        });
    })
    .catch((err)=>{log.error(err)});

app.post('/login/:email/:pass', function (req,res) {
    log.event('Authorizing user...');
    let data = {email: req.params.email, password: req.params.pass};
    db.User.authorize(data).then((auth) => res.json(auth));
});

app.post('/register/:email/:pass', function (req,res) {
    log.event('Registering user...');
    db.User.register(req.params)
    .then(db.User.authorize.bind(db.User))
    .then((auth) => {
        db.User.prepareAll()
            .then((users) => {
                auth.userList = users;
                res.json(auth);
            }
        );
    })
    .catch((err) => log.error(err));
});

io.on('connection', jwtIO.authorize({
    secret: 'super_secret code',
    timeout: 30000
}));

io.on('authenticated', connectSocket);

function connectSocket(socket) {
    let user = db.User.all[socket.decoded_token.id];
    if(typeof user === "undefined") {
        log.error("USER NOT FOUND");
        socket.emit(events.serverUserLogout);
    } else {
        usersOnline[user.id] = user.data;
        user.socket = socket;
        log.event(user.email + " connected.");
        socket.emit(events.serverEvents, events);
        socket.emit(events.serverUserData, sendUserData(user));
        socket.broadcast.emit(events.serverUserConnect, user.data);
        socket.on("disconnect", function () {
            log.recurrent("User " + user.email + " disconnected");
            delete usersOnline[user.id];
        });
    }
    socket.on(events.clientConversationSync, syncConversations);
    socket.on(events.clientUserFriendAdd, addFriends);
    socket.on(events.clientUserList, sendUserList);
    socket.on(events.clientMessageSend, send);
    socket.on(events.clientConversationCreate, createConversation);
    socket.on(events.clientRequestConversation, provideConversation);

}

function createConversation(conversationRequest){
    // when one user starts a conversation, provides either the existing conversation or creates a new one
    let members = [];
    for (let i in conversationRequest.users) {
        members[i] = db.User.all[conversationRequest.users[i]].email;
    }
    let name = members.join(", ");

    let conversation = null;
    new Promise((resolve, reject) => {
        db.Conversation.findByMembers(conversationRequest.users)
            .then((existing) => {
                if (existing){
                    conversation = new Conversation(existing.members, existing.name, existing.id);
                    return resolve(conversation);
                } else {
                    conversation = new Conversation(conversationRequest.users, name);
                    db.Conversation.create(conversation.id, conversationRequest.users, name)
                        .then(() => {return resolve(conversation)})
                        .catch((err) => reject(err));
                }
            });
    })
    .then((conv) => {
        db.Conversation.all[conv.id] = conv;
        db.User.all[conversationRequest.userId].socket.emit(events.serverConversationData, conv)
    })
    .catch((err) => log.debug('Error creating conversation ' + err));
}

function send(message){
    message = new Message(message.id, message.from, message.text, message.conversationId);
    let conversation = db.Conversation.all[message.conversationId];
    log.message(db.User.all[message.from].email + " > " + conversation.name);

    let members = conversation.members;
    for (let memberId in members) {
        let member = db.User.all[memberId];

        // receiving conversation member is online
        if (member.id in usersOnline && member.id != message.from) {
            let memberSocket = member.socket;

            // send conversation and add to user who doesn't have it yet
            if (!member.conversations.includes(message.conversationId)){
                memberSocket.emit(events.serverConversationData, conversation);
                member.addConversation(conversation.id);
            }
            // send the message
            memberSocket.emit(events.serverMessageSend, message);

        // receiving conversation member is offline
        } else if (!member.id in usersOnline && member.id != message.from) {
            if (!member.conversations.includes(message.conversationId)){
                member.addConversation(conversation.id)
            }
        }
    }
    db.Message.create(message);
}

function sendUserData(user) {
    let data = {};
    data.userData = user.data;
    data.friendsList = createFriendsList(user);
    return data;
}

function sendUserList(id) {
    db.User.prepareAll()
        .then((users) => {db.User.all[id].socket.emit(events.serverUserList, users);});
}


function createFriendsList(user) {
    log.recurrent("Creating friends list for " + user.id);
    let list = {};
    user.friends.forEach((friend) => {
        let newFriend= db.User.all[friend];
        list[friend] = newFriend.data;
    });
    return list;
}

function addFriends(data){
    let user = db.User.all[data.id];
    log.recurrent("Adding friends for " + user.name);
    if (user.friends === null) {
        user.public.friends = [];
    }

    data.friends.forEach((friendId) => {
        if (!user.friends.includes(friendId)) {
            user.addFriend(friendId);
            let friend = db.User.all[friendId];
            if (!friend.friends.includes(user.id)){
                friend.addFriend(user.id).then(() => {
                    if (friendId in usersOnline) {
                        db.User.all[friendId].socket.emit(events.serverUserFriendsList, createFriendsList(friend));
                    }
                });
            }
            db.User.saveFriends(friend);
        }
    });
    user.socket.emit(events.serverUserFriendsList, createFriendsList(user));
    db.User.saveFriends(user);
}

function syncConversations(conversations) {
    let user = conversations[0];
    let clientConvs = conversations[1];
    log.recurrent("Syncing conversations for " + user.id);
    log.debug(clientConvs);
    // get conversations from server
    let serverConvs = db.User.all[user.id].conversations;
    let missingConvs = {};
    for (let convId in serverConvs) {
        if (convId in clientConvs) {
            let clientMessages = clientConvs[convId];
            for (let message in serverConvs[convId]){
                if (!clientMessages.contains(message)){
                    missingConvs[convId] = serverConvs[convId];
                    break;
                }
            }
        } else {
            missingConvs[convId] = serverConvs[convId];
        }
    }
}

function provideConversation(convRequest) {
    let userId = convRequest.user;
    let conversationId = convRequest.conversation;
    let conversation = db.Conversation.get(conversationId);
}