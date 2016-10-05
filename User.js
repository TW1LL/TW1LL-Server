"use strict";

let uuid = require('uuid');
let Message = require('./Message');
class User {

    constructor(send,  data) {
        this._id = uuid.v1(); // underscore infers private
        this.public = {
            id: this._id,
            email: null,
            friends: [],
            nickname: null
        };
        this.conversations = {};
        this.socket = null;
        this.sendCallback = send;

        if(typeof data !== "undefined") {
            this._id = data.id;
            this.public.id = data.id;
            this.email = data.email;
            this.public.friends = data.friends;
            this.nickname = data.nickname;
        }
    }

    send(message) {
        this.conversations.push(message);
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
    get nickname() {
        return this.public.nickname;
    }
    set nickname(nick) {
        return this.public.nickname;
    }
    get friends() {
        return this.public.friends;
    }
    addFriend(friend) {
        this.public.friends.push(friend);
    }
    removeFriend(friendId) {
        this.public.friends.slice(this.public.friends.indexOf(friendId));
    }

    get data() {
        return this.public;
    }

}

module.exports = User;
