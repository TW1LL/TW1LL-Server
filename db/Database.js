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
            "createUserTable": "CREATE TABLE IF NOT EXISTS users (id TEXT, email TEXT, friends TEXT, nickname TEXT, conversations TEXT, created_date TEXT, last_modified_date TEXT, PRIMARY KEY (id))",
            "createMessageTable": "CREATE TABLE IF NOT EXISTS messages (id TEXT, conversation_id TEXT, from_id TEXT, message TEXT, timestamp TEXT, PRIMARY KEY (id))",
            "createUserPasswordTable": "CREATE TABLE IF NOT EXISTS user_passwords (id TEXT, password_hash TEXT, created_date TEXT, last_modified_date TEXT, PRIMARY KEY (id))",
            "createConversationsTable": "CREATE TABLE IF NOT EXISTS conversations (id TEXT, members TEXT, name TEXT, created_date TEXT, last_modified_date TEXT, PRIMARY KEY (id))"
        };

        this.queries = {
            // user queries
            "createUser": "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)",
            "getUser": "SELECT * FROM users WHERE id = ?",
            "findIdByEmail": "SELECT id FROM users WHERE email = ?",
            "saveFriends": "UPDATE users SET friends = ?, last_modified_date = ? WHERE id = ?",
            "updateConversations": "UPDATE users SET conversations = ?, last_modified_date = ? WHERE id = ?",
            "getConversations": "SELECT conversations FROM users WHERE id = ?",
            // user password queries
            "retrievePassword": "SELECT * FROM user_passwords WHERE id = ?",
            "createNewPassword": "INSERT INTO user_passwords VALUES (?, ?, ?, ?)",
            "updatePassword": "UPDATE user_passwords SET password_hash = ?, last_modified_date = ? WHERE id = ?",
            "deletePassword": "DELETE FROM user_passwords WHERE id = ?",
            // message queries
            "createMessage": "INSERT INTO messages VALUES (?, ?, ?, ?, ?)",
            "retrieveMessagesByConversation": "SELECT * FROM messages WHERE conversation_id = ?",
            // conversation queries
            "createConversation": "INSERT INTO conversations VALUES (?, ?, ?, ?, ?)",
            "retrieveConversationById": "SELECT * FROM conversations WHERE id = ?",
            "retrieveConversationByMembers": "SELECT * FROM conversations WHERE members = ( ? )",
            "retrieveConversationByIdList": "SELECT * FROM conversations WHERE id IN ( ? )"
        };
    }

    connect(directory) {
        return new Promise ((resolve, reject) => {
            db.open('tw1ll.sqlite3', {mode:sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, verbose:true, Promise: Promise})
                .then((database) => {
                    if (database.driver.open != true) {
                        log.error("Error opening database:", database);
                        reject(false);
                    } else {
                        this.db = database;
                        this.prepareTables()
                            .then(this.prepareQueryStatements.bind(this))
                            .then(this.prepareModels.bind(this))
                            .then(() => resolve("Database connected"))
                            .catch((err) => {reject('connect err' + err)})
                    }
                })
            })
    }

    prepareTables(){
        log.event("Preparing DB tables");
        return new Promise((resolve, reject) => {
            let tablePromises = [];
            for (let createStatement in this.tableCreateStatements) {
                tablePromises.push(this.db.exec(this.tableCreateStatements[createStatement]));
            }
            Promise.all(tablePromises)
                .then(() => {
                    resolve('DB prepared');
                })
                .catch ((error) => {reject(error);})
        })
    }

    prepareQueryStatements(){
        log.event("Preparing DB statements");
        return new Promise((resolve, reject) => {
            let statementPromises  = [];
            let statements = {};
            for(let query in this.queries){
                let queryText = this.queries[query];
                let statement = this.db.prepare(queryText);
                statementPromises.push(statement);
                statements[query] = statement.then((stmt) => statements[query] = stmt);
            }
            Promise.all(statementPromises)
                .then(() => {
                    this.queries = statements;
                    resolve('Completed preparing statements');
                })
                .catch((err) => reject(err));
        })

    }

    prepareModels(){
        log.event("Preparing models");
        return new Promise ((resolve, reject) => {
            this.User = new User(this);
            this.User.ready
                .then((result) => {
                    this.Message = new Message(this);
                    this.Conversation = new Conversation(this);
                    this.Conversation.ready
                        .then(() => {
                            resolve(true);
                        })
                        .catch((err) => console.log('ERR', err))
                })
        })
    }

    close(){
        this.db.close();
    }
}

module.exports = new Database();