"use strict";

let uuid = require('uuid');
let db = require("sqlite");
let sqlite3 = require('sqlite3');
let Log = require('./../Log');
let log = new Log("high");
let User = require('./User'),
    Message = require('./Message'),
    Conversation = require('./Conversation');

class Database {

    constructor() {
        this.db = null;
        this.User = null;
        this.Message = null;
        this.Conversation = null;
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
            "deletePassword": "DELETE FROM user_passwords WHERE id = ?",
            // message queries
            "createMessage": "INSERT INTO messages VALUES (?, ?, ?, ?, ?)",
            "retrieveMessagesByConversation": "SELECT * FROM messages WHERE conversation_id = ?",
            // conversation queries
            "createConversation": "INSERT INTO conversations VALUES (?, ?, ?)",
            "retrieveConversationById": "SELECT * FROM conversations WHERE id = ?",
            "retrieveConversationByMembers": "SELECT * FROM conversations WHERE members = ( ? )",
            "retrieveConversationByIdList": "SELECT * FROM conversations WHERE id IN ( ? )"
        };
    }

    connect() {
        return new Promise ((resolve, reject) => {
            db.open('tw1ll.sqlite3', {mode:sqlite3.OPEN_READWRITE, verbose:true}, Promise)
                .then((database) => {
                    if (database.driver.open != true) {
                        log.error("Error opening database:", database);
                        reject(false);
                    } else {
                        this.db = database;
                        this.prepareDB()
                            .then(() => {return resolve(this.prepareModels())})
                    }
                })
            })
    }

    prepareModels(){
        return new Promise ((resolve, reject) => {
            this.User = new User(this);
            this.User.ready
                .then(() => {
                    this.Message = new Message(this);
                    this.Conversation = new Conversation(this);
                    resolve(true);
                });
        })
    }

    prepareDB(){
        log.event("Preparing DB tables and queries");
        return new Promise((resolve, reject) => {
            for (let createStatement in this.tableCreateStatements) {
                this.db.exec(this.tableCreateStatements[createStatement])
                    .then((result)=> {
                        return resolve();
                    })
                    .catch ((error) => {
                        if (error){
                            log.event("Error creating table " + createStatement);
                            log.event(error);
                            reject(error);
                        }
                    });
            }

            let statements  = {};
            for(let query in this.queries){
                let queryText = this.queries[query];
                this.db.prepare(queryText, null)
                    .then((preparedStatement) => {
                        statements[query] = preparedStatement;
                    })
                    .catch(() => {
                        log.event("error preparing query " + query);
                        log.event(error);
                    });
            }

            this.queries = statements;
            resolve();
        })
    }

    close(){
        this.db.close();
    }
}

module.exports = new Database();