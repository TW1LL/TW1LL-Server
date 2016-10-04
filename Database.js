"use strict";
let db = require("sqlite3");

class Database {

    constructor() {
        this.db = new db.Database("tw1ll.sqlite3", db.OPEN_READWRITE | db.OPEN_CREATE, function (error) {
            if (error) {
                console.log("Error opening database:", error)
            }
        });

        this.createUserTable = "CREATE TABLE IF NOT EXISTS users (id TEXT, username TEXT, email TEXT, PRIMARY KEY (id))";
        this.createMessageTable = "CREATE TABLE IF NOT EXISTS messages (id TEXT, to_id TEXT, from_id TEXT, message_text TEXT, timestamp TEXT, PRIMARY KEY (id))";
        this.createUserPasswordTable = "CREATE TABLE IF NOT EXISTS user_password (id TEXT, password_salt TEXT, password_hash TEXT, PRIMARY KEY (id))";

        this.queries = {
            "createUser": "INSERT INTO users VALUES (?, ?, ?)",
            "createMessage": "INSERT INTO messages VALUES (?, ?, ?, ?, ?)",
            "getUser": "SELECT * FROM users WHERE id = ?",
            "retrieveMessage": "SELECT * FROM messages WHERE to_id = $id or from_id = $id",
            "retrievePassword": "SELECT * FROM user_password WHERE id = ?",
            "createNewPassword": "INSERT INTO user_password VALUES (?, ?, ?)",
            "updatePassword": "UPDATE user_password SET password_salt = ?, password_hash = ? WHERE id = ?",
            "findIdByEmail": "SELECT id FROM users WHERE email = ?"
        };

        this.prepareDB();
    }

    prepareDB(){
        return new Promise((resolve, reject) => {

            this.db.exec(this.createUserTable, function(error){
                if (error){
                    console.log("Error creating user table:", error);
                }
            });
            this.db.exec(this.createMessageTable, function(error){
                if (error){
                    console.log("Error creating messages table:", error);
                }
            });
            this.db.exec(this.createUserPasswordTable, function(error){
                if(error){
                    console.log("Error creating password table:", error);
                }
            });

            this.prepareQueries().then(resolve);

        })
    }

    // prepares all queries to speed execution time
    prepareQueries() {
        return new Promise((resolve, reject) => {
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
        console.log("retrieving password");
        return new Promise((resolve, reject) => {
            if (userId == false) {
                resolve(false);
            } else {
                this.queries.retrievePassword.get(userId, function (err, row) {
                    if (typeof row !== "undefined") {
                        resolve(row)
                    } else {
                        console.log("error on retreiving password", err);
                        resolve(false);
                    }
                });
            }
        })
    }

    createNewPassword(userId, salt, hash) {
        return new Promise((resolve, reject) => {
            this.queries.createNewPassword.run([userId, salt, hash]);
            resolve(true);
        });
    }

    createUser(user){
        console.log("user id", user.id);
        return new Promise((resolve, reject) => {
            let data = [user.id, user.name, user.email];
            resolve(this.queries.createUser.run(data))
        });

    }

    createMessage(message){
        let data = [message.id, message.to, message.from, message.text, message.timestamp];
        return this.queries["createMessage"].run(data);
    }

    findIdByEmail(email){
        console.log("email", email);
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
        return new Promise((resolve, reject) => {
            this.queries.getUser.get(id, (err, row) => {resolve(row)});
        })
    }

    getAllUsers() {
        return new Promise((resolve, reject) => {

            this.db.all(this.queries.getAllUsers, [], (err, rows) => {resolve(rows)});
        })
    }
}

module.exports = new Database();