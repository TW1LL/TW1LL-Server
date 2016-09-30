"use strict";

let uuid = require('uuid');
let Message = require('./Message');
class User {

    constructor(socket, send) {
        this.id = uuid.v1();
        this.name = null;
        this.messages = [];
        this.socket = socket;
        this.sendCallback = send;
    }

    send(message) {
        this.messages.push(message);
        this.sendCallback(message);
    }

    receive(newMessage) {
        this.messages.push(newMessage);
        this.socket.emit("message receive", newMessage);
    }

    get data() {
        return {
            "id" : this.id,
            "name": this.name,
            "socketId": this.socket.id
        };
    }
}

module.exports = User;
