"use strict";

let Log = require('./../Log');
let log = new Log("high");

class Conversation {

    constructor(context) {
        this.context = context;
    }

    create(id, users, name) {
        log.recurrent("Creating conversation " + name);
        log.debug(id);
        log.debug(users);
        return new Promise ((resolve, reject) => {
            this.context.queries.createConversation.run([id, users, name], function(err){
                if (this.lastID) {
                    resolve(true);
                } else {
                    reject(err);
                }
            })
        })
    }

    findIdByMembers(users){
        log.recurrent("Retrieving conversation by users" );
        log.debug(users);
        return new Promise((resolve) => {
            this.context.queries.retrieveConversationByMembers.get(users, (err, row) => {
                if (row) {
                    resolve(row)
                } else {
                    resolve(false)
                }
            })
        })
    }

    get(id) {
        log.recurrent("Retrieving conversation " + id);
        return new Promise ((resolve, reject) => {
            this.context.queries.retrieveConversationById.get(id, (err, row) => {
                log.debug(err);
                log.debug(row);
                if (row) {
                    resolve(new Conversation(row.members, row.name, row.id));
                } else {
                    reject(err);
                }
            })
        })
    }

    getList(ids){
        log.recurrent("Retrieving conversations " + ids);
        let idString = "'" + ids.join("', '") + "'";
        console.log(idString);
        return new Promise ((resolve, reject) => {
            this.context.queries.retrieveConversationByIdList.all(idString, function(err, rows) {
                log.debug(this);
                log.debug(err);
                log.debug(rows);
                if(rows) {
                    let conversations = {};
                    for (let data in rows){
                        conversations[data.id] = rows[data];
                    }
                    resolve(conversations);
                } else {
                    reject(err);
                }
            })
        })
    }
}

module.exports = Conversation;