let Log = require('./../Log');
let log = new Log("high");

class Conversation {

    constructor(context) {
        this.context = context;
    }

    create(id, users, name) {
        log.recurrent("Creating conversation " + name);
        log.debug(id);
        log.debug(users);
        return new Promise ((resolve, reject) => {
            this.context.queries.createConversation.run([id, users, name], (err) => {
                if (this.lastID) {
                    resolve(true);
                } else {
                    reject(err);
                }
            })
        })
    }

    findId(users){
        log.recurrent("Retrieving conversation by users" );
        log.debug(users);
        return new Promise((resolve) => {
            this.context.queries.retrieveConversationByMembers.get(users, (err, row) => {
                if (row) {
                    resolve(row)
                } else {
                    resolve(false)
                }
            })
        })
    }

    getById(id) {
        log.recurrent("Retrieving conversation " + id);
        return new Promise ((resolve, reject) => {
            this.context.queries.retrieveConversationById.get(id, (err, row) => {
                log.debug(err);
                log.debug(row);
                if (row) {
                    resolve(new Conversation(row.members, row.name, row.id));
                } else {
                    reject(err);
                }
            })
        })
    }
}

module.exports = Conversation;