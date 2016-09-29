"use strict";

let uuid = require('uuid');
let Message = require('./Message');
let io = require('./index').io;
let users = require('./index').users;

class User {

    constructor(socket, name) {
        this.id = uuid.v1();
        this.name = name;
        this.messages = [];
        this.socket = socket;
    }

    send(message) {
        let new_message = new Message(message.to, this.id, message.text);
        this.messages.push(new_message);
        user[to].emit("message send", new_message);
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
