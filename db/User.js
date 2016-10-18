"use strict";

let Log = require('./../Log');
let log = new Log("debug");
let bcrypt = require('bcrypt-nodejs');
let jwt = require('jsonwebtoken');
let User = require('./../Models/User');
let uuid = require('uuid');

class UserDB {
    constructor(context) {
        this.context = context;
        this.ready = new Promise((resolve) => {
            this.getAll()
                .then((users) => {
                    this.all = users;
                    resolve(true);
                });
        });
    }

    saveFriends(user) {
        log.recurrent("Saving friends for " + user.email);
        return new Promise((resolve, reject) => {
            let friends = user.friends.join(', ');
            let localUser = this.all[user.id];
            if (typeof localUser !== "undefined") {
                this.context.queries.saveFriends.run([friends, Date.now(), user.id])
                    .then(function (result){
                        if (typeof result.stmt.lastID !== "undefined" && result.stmt.changes == 1) {
                            return resolve(true);
                        } else {
                            return reject(result);
                        }
                    });
            } else {
                reject("User doesn't exist.")
            }
        })
    }

    saveConversations(user) {
        log.recurrent("Saving conversations for " + user.email);
        return new Promise ((resolve, reject) => {
            if (typeof user !== "undefined") {
                console.log([user.conversations.join(', '), Date.now().toString(), user.id]);
                this.context.queries.saveConversations.run([user.conversations.join(', '), Date.now().toString(), user.id])
                    .then((result) => {
                        console.log("result", result);
                        if (typeof result.stmt.lastID !== "undefined" && result.stmt.changes == 1) {
                            return resolve(true);
                        } else {
                            return reject(result);
                        }
                    })
            } else {
                reject("No user passed to save conversations for.")
            }
        })
    }


    getPassword(userId) {
        log.recurrent("Retrieving password for " + userId);
        return new Promise((resolve, reject) => {
            if (userId == false) {
                return resolve(false);
            } else {
                this.context.queries.retrievePassword.get(userId)
                    .then(function (row) {
                        if (typeof row !== "undefined") {
                            return resolve(row)
                        } else {
                            return reject("User ID does not exist.");
                        }
                    });
            }
        })
    }

    findIdByEmail(email){
        log.recurrent("Finding user by email");
        log.debug(email);
        return new Promise((resolve, reject) => {
            this.context.queries.findIdByEmail.get(email)
                .then((row) => {
                    if (typeof row !== "undefined") {
                        return resolve(row.id);
                    } else {
                        return reject("User does not exist with that email address.");
                    }
                });
        });
    }

    get(id){
        log.recurrent("Getting user" + id);
        return new Promise((resolve, reject) => {
            this.context.queries.getUser.get(id)
                .then((row) => {
                    if (typeof row !== "undefined") {
                        if(row.conversations != null) {
                            row.conversations = row.conversations.split(', ');
                        }
                        resolve(new User(row));
                    } else {
                        reject("User does not exist with that ID.");
                    }
                });
        })
    }

    getAll() {
        let getAllUsers = "SELECT * FROM users";
        log.event("Getting all users");
        return new Promise((resolve, reject) => {
            this.context.db.all(getAllUsers)
                .then((rows) => {
                    let users = {};
                    rows.forEach((row)=> {
                        users[row.id] = new User(row);
                    });
                    return resolve(users);
                })
                .catch((error) => {
                    log.debug("Error getting all users" + error);
                });
        })
    }

    createNewPassword(userId, hash) {
        log.recurrent("Creating new password for " + userId);
        log.debug("PW hash = " + hash);
        return new Promise((resolve, reject) => {
            this.context.queries.createNewPassword.run([userId, hash, Date.now(), Date.now()])
                .then(function(result) {
                    if (typeof result.stmt.lastID !== "undefined" && result.stmt.changes == 1){
                        return resolve(true);
                    } else {
                        reject(result);
                    }
                })
                .catch((err) => log.error('Error creating password ' + err));
        });
    }

    deletePassword(userId){
        log.recurrent("Deleting password for " + userId);
        return new Promise((resolve, reject) => {
            this.context.queries.deletePassword.run(userId)
                .then((err) => {
                    if (err) {
                        log.debug(err);
                        return reject(err);
                    } else {
                        return resolve(true);
                    }
                });
        })
    }

    register(params) {
        log.recurrent("Registering new user " + params.email);
        return new Promise((resolve) => {
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(params.pass, salt, null, (err, hash) => {
                        let user = new User();
                        user.email = params.email;
                        this.all[user.id] = user;
                        this.create(user).then(() => {
                            this.createNewPassword(user.id, hash).then(() => {
                                return resolve({email: params.email, password: params.pass});
                            });
                        }).catch((err) => log.error(err));
                    });
            });
        })
    }

    create(user){
        log.recurrent("Creating new user", user.name);
        return new Promise((resolve, reject) => {
            let data = [user.id, user.email, user.friends, user.nickname, user.conversations, Date.now(), Date.now()];
            this.context.queries.createUser.run(data)
                .then((result) => {
                    if (typeof result.stmt.lastID !== "undefined" && result.stmt.changes == 1) {
                        return resolve(true);
                    }
                })
                .catch((err) => reject(err));
        });
    }

    authorize(params) {
        log.recurrent("Authorizing user " + params.email);
        return new Promise((resolve, reject) => {
            this.findIdByEmail(params.email)
                .then(this.getPassword.bind(this))
                .then((userPWData) => {
                    log.debug("Password lookup result");
                    log.debug(userPWData);
                    let data;
                    if (userPWData) {
                        bcrypt.compare(params.password, userPWData.password_hash, (err, res) => {
                                if (res) {
                                    let user = this.all[userPWData.id].data;
                                    log.debug("Auth Success! Generating user token.");
                                    data = {
                                        valid: true,
                                        token: jwt.sign(user, 'super_secret code', {expiresIn: "7d"}),
                                        id: userPWData.id,
                                        data: user
                                    };
                                    return resolve(data);
                                } else {
                                    data = {
                                        valid: false,
                                        data: "Password doesn't match."
                                    };
                                    return reject(data);
                                }
                            });
                    } else {
                        data = {
                            valid: false,
                            data: "No User found with that email."
                        };
                        return reject(data);
                    }
                })
                .catch((error) => {reject(error)});
        })
    }

    prepare(userId) {
        log.recurrent("Preparing user data for " + userId);
        return new Promise((resolve) => {
            if (typeof this.all[userId] === "undefined") {
                this.get(id)
                    .then((user) => {
                        this.all[user.id] = user;
                        return resolve(user.data);
                    });
            } else {
                return resolve(this.all[userId].data);
            }
        });
    }

    prepareAll() {
        log.event("Preparing all user data");
        return new Promise((resolve)=> {
            if (Object.keys(this.all).length === 0 && this.all.constructor === Object) {
                this.getAll()
                    .then((users) => {
                        // if the DB has no users in it, make sure we end up with an empty object, not null
                        if (users == null) {
                            users = {};
                        }
                        this.all = users;
                        let list = {};
                        for (var id in this.all) {
                            list[id] = this.all[id].data;
                        }
                        return resolve(list);
                    });
            } else {
                let list = {};
                for (var id in this.all) {
                    list[id] = this.all[id].data;
                }
                return resolve(list);
            }
        })
    }
    
    getConversations(id) {
        log.recurrent("Getting conversations for " + id);
        return new Promise((resolve, reject) => {
            let conversations = {};
            this.context.queries.getConversations.get(id)
                .then((convIdString) => {
                    let convIds = convIdString.split(', ');
                    for (let convId in convIds) {
                        let messages = this.context.Message.getMessagesForConversation(convId);
                        conversations[convId] = messages;
                    }
                    Promise.all(conversations)
                        .then(resolve(conversations));
                });
        })
    }
}

module.exports = UserDB;