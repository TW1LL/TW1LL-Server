"use strict";

let uuid = require('uuid');

class Message {
    constructor(id, from, text, conversationId, timestamp) {
        this.id = id;
        this.conversationId = conversationId;
        this.from = from;
        this.text = text;
        if (typeof timestamp !== "undefined") {
            this.timestamp = timestamp;
        } else {
            this.timestamp = Date.now();
        }
    }
}

module.exports = Message;
