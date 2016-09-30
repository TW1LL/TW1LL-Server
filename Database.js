"use strict";

let sqlite3 = require("sqlite3").verbose();

// initialize sqlite3 server
let db = new sqlite3.Database(":memory:", sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function (error){
    if (error){
        console.log("Error opening database:", error);
    }
});

// table creation queries
let createUserTable = "CREATE TABLE IF NOT EXISTS users (id TEXT, username TEXT, PRIMARY KEY (id))";
let createMessageTable = "CREATE TABLE IF NOT EXISTS messages (id TEXT, to_id TEXT, from_id TEXT, message_text TEXT, " +
                         "timestamp TEXT, PRIMARY KEY (id))";

function createTables(){
    db.exec(createUserTable, function(error){
        if (error){
            console.log("Error creating user table:", error);
        }
    });
    db.exec(createMessageTable, function(error){
        if (error){
            console.log("Error creating messages table:", error);
        }
    });
}

// data retrieval queries
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

// sets up the queries specified as prepared statements in sql, returns tthe statements with their original label
function prepareQueries(queries){

    let statements  = {};

    for(let query in queries){
        let queryText = queries[query];
        let preparedStatement = db.prepare(queryText, null, function(error){
            if (error){
                console.log("error preparing query", query, error);
            }
        });
        statements[query] = preparedStatement;
    }
    return statements
}

function getUser(id){
    return queryStatements["getUser"].get(id);
}

function getMessage(id){
    return queryStatements["getMessage"].get(id);
}

function setUser(user){
    return queryStatements["setUser"].run([user.id, user.name]);
}

function setMessage(message){
    let data = [message.id, message.to, message.from, message.text, message.timestamp];
    return queryStatements["setMessage"].run(data);
}

createTables();

let queryStatements = prepareQueries(queries);