"use strict";

let Log = require('./../Log');
let log = new Log("high");
let Conversation = require('./../Conversation');

class ConversationDB {

    constructor(context) {
        this.context = context;
        this.getAll().then((convs) => this.all = convs);
    }

    create(id, users, name) {
        log.recurrent("Creating conversation " + name);
        log.debug(id);
        log.debug(users);
        let usersString = users.join(', ');
        return new Promise ((resolve, reject) => {
            this.context.queries.createConversation.run([id, usersString, name], function(err){
                if (this.lastID) {
                    return resolve(true);
                } else {
                    return reject(err);
                }
            })
        })
    }

    findByMembers(members){
        log.recurrent("Retrieving conversation by members" );
        log.debug(members);
        let membersString = members.join(', ');
        return new Promise((resolve) => {
            this.context.queries.retrieveConversationByMembers.get(membersString, (err, row) => {
                if (row) {
                    return resolve(row)
                } else {
                    return resolve(false)
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
                    return resolve(new ConversationDB(row.members, row.name, row.id));
                } else {
                    return reject(err);
                }
            })
        })
    }

    getList(ids){
        log.recurrent("Retrieving conversations " + ids);
        let idString = ids.join(', ');
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
                    return resolve(conversations);
                } else {
                    return reject(err);
                }
            })
        })
    }

    getAll() {
        let getAllConversations = "SELECT * FROM conversations";
        log.event("Getting all conversations");
        return new Promise ((resolve, reject) => {
            this.context.db.all(getAllConversations, [], function(err, rows) {
                if (rows) {
                    let conversations = {};
                    rows.forEach((row) => {
                        let conversation = new Conversation();
                        conversations[row.id] = row;
                    });
                    return resolve(conversations);
                } else {
                    return reject(err);
                }
            })
        })
    }
}

module.exports = ConversationDB;