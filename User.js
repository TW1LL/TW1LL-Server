"use strict";

let uuid = require('uuid');
let Message = require('./Message');
class User {

    constructor(socket, send) {
        this.id = uuid.v1();
        this.name = null;
        this.messages = [];
        this.socket = socket;
        this.send_callback = send;
    }

    send(message) {
        this.messages.push(message);
        this.send_callback(message);
    }

    receive(new_message) {
        this.messages.push(new_message);
        this.socket.emit("message receive", new_message);
    }

    get data() {
        return {
            "id" : this.id,
            "name": this.name
        };
    }
}

module.exports = User;
