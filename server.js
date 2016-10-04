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
let Log = require('./Log'), User = require('./User'), Message = require('./Message');

let config = {
    serverPort: 443,
    logLevel: "high"
};
let usersOnline = {}, users = {};
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
        db.findIdByEmail(data.email).then(db.retrievePassword.bind(db)).then((userPWData) => {
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
    socket.emit(events.serverUserList, usersOnline);
    socket.broadcast.emit(events.serverUserConnect, user.data);
    socket.on(events.clientMessageSend,  (message) => { users[message.from].send(message); });
    socket.on("disconnect", function () {
        log.event("User " + user.email + " disconnected");
        socket.broadcast.emit(events.serverUserDisconnect, user.data);
        delete usersOnline[user.id];

    });
}

function send(message){
    log.recurrent(" MSG >> " + users[message.from].email + " > " + users[message.to].email);
    let to = users[message.to];
    to.receive(message);
}
