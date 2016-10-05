"use strict";

let uuid = require('uuid');

class Message {
    constructor(from, text, conversationId) {
        this.id = uuid.v1();
        this.conversationId = conversationId;
        this.from = from;
        this.text = text;
        this.timestamp = Date.now();
    }
}

module.exports = Message;
