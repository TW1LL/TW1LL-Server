"use strict";

let uuid = require('uuid');
let Message = require('./Message');
class User {

    constructor(send, data) {
        this._id = uuid.v1(); // underscore infers private
        this.public = {
            id: this._id,
            email: null,
            nickname: null
        };
        this.friends = [];
        this.conversations = [];
        this.socket = null;
        this.sendCallback = send;

        if(typeof data !== "undefined") {
            this._id = data.id;
            this.public = data;
        }
    }

    send(message) {
        this.messages.push(message);
        this.sendCallback(message);
    }

    receive(newMessage) {
        this.messages.push(newMessage);
        this.socket.emit("server message receive", newMessage);
    }


    get id() {
        return this._id;
    }
    set id(id) {
    // invalid, cannot change user id
    }
    get email() {
        return this.public.email;
    }
    set email(email) {
        this.public.email = email;
    }
    addFriend(friend) {
        this.friends.push(friend);
    }
    removeFriend(friendId) {
        this.friends.slice(this.public.friends.indexOf(friendId));
    }

    get data() {
        return this.public;
    }

}

module.exports = User;
