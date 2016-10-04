"use strict";
let db = require("sqlite3");
let Log = require('./Log');
let log = new Log("high");

class Database {

    constructor() {
        this.db = new db.Database("tw1ll.sqlite3", db.OPEN_READWRITE | db.OPEN_CREATE, function (error) {
            if (error) {
                console.log("Error opening database:", error)
            }
        });

        this.tableCreateStatements = {
            "createUserTable": "CREATE TABLE IF NOT EXISTS users (id TEXT, username TEXT, email TEXT, PRIMARY KEY (id))",
            "createMessageTable": "CREATE TABLE IF NOT EXISTS messages (id TEXT, conversation_id TEXT, to_id TEXT, from_id TEXT, message_text TEXT, timestamp TEXT, PRIMARY KEY (id))",
            "createUserPasswordTable": "CREATE TABLE IF NOT EXISTS user_passwords (id TEXT, password_salt TEXT, password_hash TEXT, PRIMARY KEY (id))",
            "createConversationsTable": "CREATE TABLE IF NOT EXISTS conversations (id TEXT, users TEXT)"
        };

        this.queries = {
            "createUser": "INSERT INTO users VALUES (?, ?, ?)",
            "createMessage": "INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)",
            "getUser": "SELECT * FROM users WHERE id = ?",
            "retrieveMessage": "SELECT * FROM messages WHERE to_id = $id or from_id = $id",
            "retrievePassword": "SELECT * FROM user_passwords WHERE id = ?",
            "createNewPassword": "INSERT INTO user_passwords VALUES (?, ?, ?)",
            "updatePassword": "UPDATE user_passwords SET password_salt = ?, password_hash = ? WHERE id = ?",
            "findIdByEmail": "SELECT id FROM users WHERE email = ?",
            "createConversation": "INSERT INTO conversations VALUES (?, ?)",
            "retrieveConversationById": "SELECT * FROM conversations WHERE id = ?",
            "retrieveConversationByMembers": "SELECT * FROM conversations WHERE users = ?"
        };

        this.prepareDB();
    }

    prepareDB(){
        log.event("Preparing DB tables and queries");
        return new Promise((resolve, reject) => {

            for (let createStatement in this.tableCreateStatements) {
                this.db.exec(this.tableCreateStatements[createStatement], function(error){
                    if (error){
                        console.log("Error creating table:", createStatement, error);
                    }
                });
            }

            let statements  = {};
            let preparedStatement = null;
            for(let query in this.queries){
                let queryText = this.queries[query];
                preparedStatement = this.db.prepare(queryText, null, function(error){
                    if (error){
                        console.log("error preparing query", query, error);
                    }
                });
                statements[query] = preparedStatement;
            }
            this.queries = statements;
            this.queries.getAllUsers = "SELECT * FROM users";
            resolve();
        })
    }

    retrievePassword(userId) {
        log.recurrent("Retrieving password");
        log.debug(userId);
        return new Promise((resolve, reject) => {
            if (userId == false) {
                resolve(false);
            } else {
                this.queries.retrievePassword.get(userId, function (err, row) {
                    if (typeof row !== "undefined") {
                        resolve(row)
                    } else {
                        resolve(false);
                    }
                });
            }
        })
    }

    createNewPassword(userId, salt, hash) {
        log.recurrent("Creating new password for " + userId);
        return new Promise((resolve, reject) => {
            this.queries.createNewPassword.run([userId, salt, hash], (err) => {
                log.debug(err);
                resolve(err);
            });
        });
    }

    createUser(user){
        log.recurrent("Creating new user", user.name);
        return new Promise((resolve, reject) => {
            let data = [user.id, user.name, user.email];
            this.queries.createUser.run(data, function(err) {
                if (this.lastID) {
                    resolve(true);
                } else {
                    reject(false);
                }
            })
        });
    }

    createMessage(message){
        log.recurrent("Creating new message", message.id);
        let data = [message.id, message.conversationId, message.to, message.from, message.text, message.timestamp];
        return this.queries["createMessage"].run(data);
    }

    createConversation(id, users) {
        return new Promise ((resolve, reject) => {
            this.queries.createConversation.run([id, users], (err) => {
                if (this.lastID) {
                    resolve(true);
                } else {
                    reject(false);
                }
            })
        })
    }

    findConversationId(users){
        return new Promise((resolve, reject) => {
            this.queries.retrieveConversationByMembers.get(users, (err, row) => {
                if (row) {
                    resolve(row)
                } else {
                    resolve(false)
                }
            })
        })
    }

    retrieveConversationById(id) {
        log.recurrent("Retrieving conversation " + id);
        return new Promise ((resolve, reject) => {
            this.queries.retrieveConversationById.get(id, (err, row) => {
                log.debug(err);
                log.debug(row);
                if (row) {
                    resolve(row);
                } else {
                    reject(err);
                }
            })
        })
    }

    findIdByEmail(email){
        log.recurrent("Finding user by email");
        log.debug(email);
        return new Promise((resolve, reject) => {
            this.queries.findIdByEmail.get(email, (err, row) => {
                if (typeof row !== "undefined") {
                    resolve(row.id);
                } else {
                    resolve(false);
                }
            });
        });
    }

    getUser(id){
        log.recurrent("Getting user", id);
        return new Promise((resolve, reject) => {
            this.queries.getUser.get(id, (err, row) => {resolve(row)});
        })
    }

    getAllUsers() {
        log.event("Getting all users");
        return new Promise((resolve, reject) => {

            this.db.all(this.queries.getAllUsers, [], (err, rows) => {resolve(rows)});
        })
    }
}

module.exports = new Database();