"use strict";

let Log = require('./../Log');
let log = new Log("high");
let bcrypt = require('bcrypt-nodejs');

class User {

    constructor(context) {
        this.context = context;
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
            this.context.queries.getUser.get(id, (err, row) => {resolve(row)});
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
                    return resolve(rows)}
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

    register(user, params) {
        return new Promise((resolve) => {
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(params.pass, salt, null, (err, hash) => {
                    user.email = params.email;
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

    authorize(data) {
        return new Promise((resolve) => {
            this.findIdByEmail(data.email).then(this.getPassword.bind(this)).then((userPWData) => {
                log.debug("Password lookup result");
                log.debug(userPWData);
                if (userPWData) {
                    bcrypt.compare(data.password, userPWData.password_hash, (err, res) => {
                        if (res) {
                            log.event("User authorized");
                            return resolve({valid: true, id: userPWData.id, email: data.email})
                        } else {
                            return resolve({valid: false, data: "Password doesn't match."})
                        }
                    });
                } else {
                    return resolve({valid: false, data: "User not found."});
                }
            });
        })
    }
}

module.exports = User;