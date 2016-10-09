"use strict";

let uuid = require('uuid');
let Message = require('./Message');
class User {

    constructor(data) {
        this._id = uuid.v1(); // underscore infers private
        this.public = {
            id: this._id,
            email: null,
            friends: [],
            nickname: null
        };
        this.conversations = null;
        this.socket = null;

        if(typeof data !== "undefined") {
            this._id = data.id;
            this.public.id = data.id;
            this.email = data.email;
            this.nickname = data.nickname;
            if(data.friends != null && data.friends != '') {
                data.friends = data.friends.split(', ');
            } else {
                data.friends = [];
            }
            if(data.conversations != null && data.conversations != '') {
                data.conversations = data.conversations.split(', ');
            } else {
                data.conversations = [];
            }
            this.public.friends = data.friends;

            this.conversations = data.conversations;
        }
    }

    send(message) {
        //this.conversations[message.conversationId].messages.push(message);
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
        return new Promise ((resolve) => {resolve(this.public.friends.push(friend))});
    }
    removeFriend(friendId) {
        this.public.friends.slice(this.public.friends.indexOf(friendId));
    }

    get data() {
        return this.public;
    }

}

module.exports = User;
