"use strict";

class Conversation {

    constructor(members, name, id, messages){
        this.id = uuid.v1();
        this.members = members;
        this.name = name;
        if (typeof id !== "undefined") {
            this.id = id;
        }
        if (typeof messages !== "undefined") {
            this.messages = messages;
        } else {
            this.messages = [];
        }
    }
}

module.exports = Conversation;