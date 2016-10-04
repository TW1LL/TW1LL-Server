"use strict";

let uuid = require('uuid');

class Message {
    constructor(to, from, text, conversationId, type="text") {
        this.id = uuid.v1();
        this.conversationId = conversationId;
        this.to = to;
        this.from = from;
        this.text = text;
        this.timestamp = Date.now();
    }
}

module.exports = Message;
