"use strict";

let sqlite3 = require("sqlite3").verbose();


class Database {

    constructor() {
        this.db = new sqlite3.Database(":memory:", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (error) {
            if (error) {
                console.log("Error opening database:", error);
            }
        });

        let createUserTable = "CREATE TABLE IF NOT EXISTS users (id TEXT, username TEXT, PRIMARY KEY (id))";
        let createMessageTable = "CREATE TABLE IF NOT EXISTS messages (id TEXT, to_id TEXT, from_id TEXT, message_text TEXT, " +
            "timestamp TEXT, PRIMARY KEY (id))";

        this.db.exec(createUserTable, function(error){
            if (error){
                console.log("Error creating user table:", error);
            }
            });
        this.db.exec(createMessageTable, function(error){
            if (error){
                console.log("Error creating messages table:", error);
            }
        });

        let setUserQuery = "INSERT INTO users VALUES (?, ?)";
        let setMessageQuery = "INSERT INTO messages VALUES (?, ?, ?, ?, ?)";
        let getUserQuery = "SELECT * FROM users WHERE id = ?";
        let getMessageQuery = "SELECT * FROM messages WHERE to_id = $id or from_id = $id";

        let queries = {
            "setUser": setUserQuery,
            "setMessage": setMessageQuery,
            "getUser": getUserQuery,
            "getMessage": getMessageQuery
        };
        this.queries = prepareQueries(queries);

    }


    getUser(id){
        return queryStatements["getUser"].get(id);
    }

    getMessage(id){
        return queryStatements["getMessage"].get(id);
    }

    createUser(user){
        return queryStatements["setUser"].run([user.id, user.name]);
    }

    createMessage(message){
        let data = [message.id, message.to, message.from, message.text, message.timestamp];
        return queryStatements["setMessage"].run(data);
    }
}



module.exports = new Database();

