let Log = require('./../Log');
let log = new Log("high");

class Message {

    constructor(context) {
        this.context = context;
    }

    create(message){
        log.recurrent("Creating new message " + message.id);
        log.debug(message);
        let data = [message.id, message.conversationId, message.to, message.from, message.text, message.timestamp];
        return this.context.queries["create"].run(data);
    }
}

module.exports = Message;