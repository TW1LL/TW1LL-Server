"use strict";

let uuid = require('uuid');

class Message {
    constructor(to, from, text, type="text") {
        this.to = to;
        this.from = from;
        this.text = text;
        this.id = uuid.v1();
        this.timestamp = Date.now();
    }
}

module.exports = Message;
