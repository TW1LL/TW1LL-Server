"use strict";

let Log = require('./../Log');
let log = new Log("high");
let bcrypt = require('bcrypt-nodejs');
let jwt = require('jsonwebtoken');
let User = require('./../User');
class UserDB {

    constructor(context) {
        this.context = context;
        this.all = {};
        this.prepareAll();
    }

    saveFriends(user) {
        log.recurrent("Saving friends");
        log.debug(user);
        let friends = this.context.flattenArray(user.friends);
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
                resolve(new User(sendMessage, row));
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
                        if(row.conversations != null) {
                            row.conversations = row.conversations.split(', ');
                        }
                        users[row.id] = new User(this.sendMessage, row);

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
                    let user = new User(sendMessage);
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
                            log.event("Auth Success! Generating user token.");
                            data = {
                                valid: true,
                                token: jwt.sign(auth.data, 'super_secret code', {expiresIn: "7d"}),
                                id: userPWData.id,
                                data: this.all[userPWData.id].data
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

    sendMessage() {

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
}

module.exports = UserDB;