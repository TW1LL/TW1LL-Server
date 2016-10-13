"use strict";

let Log = require('./../Log');
let log = new Log("high");
let Message = require('./../Models/Message');

class MessageDB {

    constructor(context) {
        this.context = context;
    }

    create(message){
        log.message("Creating new message " + message.id);
        log.debug(message);
        let data = [message.id, message.conversationId, message.from, message.text, message.timestamp];
        return this.context.queries.createMessage.run(data);
    }

    getMessagesForConversation(convId) {
        log.debug("Getting messages for conversation " + convId);
        return new Promise((resolve, reject) => {
            let messages = {};
            this.context.queries.retrieveMessagesByConversation.all(convId)
                .then((rows) => {
                    for (let i in rows) {
                        let row = rows[i];
                        let message = new Message(row.from_id, row.message, row.conversationId, row);
                        messages[row.id] = message;
                    }
                    resolve(messages);
                })
        })
    }
}

module.exports = MessageDB;