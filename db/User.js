"use strict";

let Log = require('./../Log');
let log = new Log("debug");
let bcrypt = require('bcrypt-nodejs');
let jwt = require('jsonwebtoken');
let User = require('./../Models/User');
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
        log.recurrent("Saving friends for " + user.name);
        let friends = user.friends.join(', ');
        return new Promise((resolve, reject) => {
            this.context.queries.saveFriends.run([friends, user.id], (err) => {
                if (err) {
                    return reject(err);
                } else {
                    return resolve(true);
                }
            })
        })
    }

    getPassword(userId) {
        log.recurrent("Retrieving password for " + userId);
        return new Promise((resolve) => {
            if (userId == false) {
                return resolve(false);
            } else {
                this.context.queries.retrievePassword.get(userId, function (err, row) {
                    if (typeof row !== "undefined") {
                        return resolve(row)
                    } else {
                        return resolve(false);
                    }
                });
            }
        })
    }

    findIdByEmail(email){
        log.recurrent("Finding user by email");
        log.debug(email);
        return new Promise((resolve) => {
            this.context.queries.findIdByEmail.get(email, (err, row) => {
                if (typeof row !== "undefined") {
                    return resolve(row.id);
                } else {
                    return resolve(false);
                }
            });
        });
    }

    get(id){
        log.recurrent("Getting user", id);
        return new Promise((resolve) => {
            this.context.queries.getUser.get(id, (err, row) => {
                if(row.conversations != null) {
                    row.conversations = row.conversations.split(', ');
                }
                resolve(new User(row));
            });
        })
    }

    getAll() {
        let getAllUsers = "SELECT * FROM users";
        log.event("Getting all users");
        return new Promise((resolve, reject) => {
            this.context.db.all(getAllUsers, [], (err, rows) => {
                if (err) {
                    log.debug(err);
                    log.debug(rows);
                    return reject(rows);
                } else {
                    let users = {};
                    rows.forEach((row)=> {
                        users[row.id] = new User(row);

                    });
                    return resolve(users);
                }
            });
        })
    }

    createNewPassword(userId, salt, hash) {
        log.recurrent("Creating new password for " + userId);
        log.debug(salt);
        log.debug(hash);
        return new Promise((resolve) => {
            this.context.queries.createNewPassword.run([userId, salt, hash], (err) => {
                log.debug(err);
                return resolve(err);
            });
        });
    }

    register(params) {
        return new Promise((resolve) => {
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(params.pass, salt, null, (err, hash) => {
                    let user = new User();
                    user.email = params.email;
                    this.all[user.id] = user;
                    this.create(user).then(() => {
                        this.createNewPassword(user.id, salt, hash).then(() => {
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
            let data = [user.id, user.email, user.friends, user.nickname, user.conversations];
            this.context.queries.createUser.run(data, function(err) {
                if (this.lastID) {
                    return resolve(true);
                } else {
                    return reject(err);
                }
            })
        });
    }

    authorize(params) {
        return new Promise((resolve) => {
            this.findIdByEmail(params.email).then(this.getPassword.bind(this)).then((userPWData) => {
                log.debug("Password lookup result");
                log.debug(userPWData);
                let data;
                if (userPWData) {
                    bcrypt.compare(params.password, userPWData.password_hash, (err, res) => {
                        if (res) {
                            let user = this.all[userPWData.id].data;
                            log.event("Auth Success! Generating user token.");
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
                            return resolve(data);
                        }
                    });
                } else {
                    data = {
                        valid: false,
                        data: "No User found with that email."
                    };
                    return resolve(data);
                }
            });
        })
    }

    prepare(userId) {
        return new Promise((resolve) => {
            if (typeof this.all[userId] === "undefined") {
                this.get(id).then((user) => {
                    this.all[user.id] = user;
                    return resolve(user.data);
                });
            } else {
                return resolve(this.all[userId].data);
            }
        });
    }
    prepareAll() {
        return new Promise((resolve)=> {
            if (Object.keys(this.all).length === 0 && this.all.constructor === Object) {
                this.getAll().then((users) => {
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
            this.context.queries.getConversations(id, (convIdString) => {
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