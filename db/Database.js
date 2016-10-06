"use strict";

let uuid = require('uuid');
let db = require("sqlite3");
let Log = require('./../Log');
let log = new Log("high");
let User = require('./User'),
    Message = require('./Message'),
    Conversation = require('./Conversation');

class Database {

    constructor() {
        this.db = new db.Database("tw1ll.sqlite3", db.OPEN_READWRITE | db.OPEN_CREATE, (error) => {
            if (error) {
                log.error("Error opening database:", error)
            } else {
                this.tableCreateStatements = {
                    "createUserTable": "CREATE TABLE IF NOT EXISTS users (id TEXT, email TEXT, friends TEXT, nickname TEXT, conversations TEXT, PRIMARY KEY (id))",
                    "createMessageTable": "CREATE TABLE IF NOT EXISTS messages (id TEXT, conversation_id TEXT, from_id TEXT, message TEXT, timestamp TEXT, PRIMARY KEY (id))",
                    "createUserPasswordTable": "CREATE TABLE IF NOT EXISTS user_passwords (id TEXT, password_salt TEXT, password_hash TEXT, PRIMARY KEY (id))",
                    "createConversationsTable": "CREATE TABLE IF NOT EXISTS conversations (id TEXT, members TEXT, name TEXT)"
                };

                this.queries = {
                    // user queries
                    "createUser": "INSERT INTO users VALUES (?, ?, ?, ?, ?)",
                    "getUser": "SELECT * FROM users WHERE id = ?",
                    "findIdByEmail": "SELECT id FROM users WHERE email = ?",
                    "saveFriends": "UPDATE users SET friends = ? WHERE id = ?",
                    "updateConversations": "UPDATE users SET conversations = ? WHERE id = ?",
                    "getConversations": "SELECT conversations FROM users WHERE id = ?",
                    // user password queries
                    "retrievePassword": "SELECT * FROM user_passwords WHERE id = ?",
                    "createNewPassword": "INSERT INTO user_passwords VALUES (?, ?, ?)",
                    "updatePassword": "UPDATE user_passwords SET password_salt = ?, password_hash = ? WHERE id = ?",
                    // message queries
                    "createMessage": "INSERT INTO messages VALUES (?, ?, ?, ?, ?)",
                    "retrieveMessagesByConversation": "SELECT * FROM messages WHERE conversation_id = ?",
                    // conversation queries
                    "createConversation": "INSERT INTO conversations VALUES (?, ?, ?)",
                    "retrieveConversationById": "SELECT * FROM conversations WHERE id = ?",
                    "retrieveConversationByMembers": "SELECT * FROM conversations WHERE members = ( ? )",
                    "retrieveConversationByIdList": "SELECT * FROM conversations WHERE id IN ( ? )"
                };

                this.prepareDB();
                this.User = new User(this);
                this.User.ready
                    .then(() => {
                        this.Message = new Message(this);
                        this.Conversation = new Conversation(this);
                    });
            }
        });
    }

    prepareDB(){
        log.event("Preparing DB tables and queries");
        return new Promise((resolve) => {

            for (let createStatement in this.tableCreateStatements) {
                this.db.exec(this.tableCreateStatements[createStatement], function(error){
                    if (error){
                        log.event("Error creating table " + createStatement);
                        log.event(error);
                    }
                });
            }

            let statements  = {};
            for(let query in this.queries){
                let queryText = this.queries[query];
                let preparedStatement = this.db.prepare(queryText, null, function(error){
                    if (error){
                        log.event("error preparing query " + query);
                        log.event(error);
                    }
                });
                statements[query] = preparedStatement;
            }
            this.queries = statements;
            resolve();
        })
    }
}

module.exports = new Database();