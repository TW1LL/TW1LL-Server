"use strict";

let uuid = require('uuid');

class Message {
    constructor(from, text, conversationId, data) {
        this.id = uuid.v1();
        this.conversationId = conversationId;
        this.from = from;
        this.text = text;
        this.timestamp = Date.now();

        if (typeof data !== "undefined") {
            this.id = data.id;
            this.timestamp = data.timestamp;
        }
    }
}

module.exports = Message;
