"use strict";

let db = require('./../db/Database');
let User = require('./../db/User');
let Conversation = require('./../db/Conversation');
let Message = require('./../db/Message');

// Not sure if I need these two?
// let describe = require('mocha').describe;
// let it = require('mocha').it;
let expect = require('chai').expect;

describe("User data manipulation", () => {
    describe("Get password hash", () => {
        it("Retrieves a password hash for a given user", () => {
            // get the first user - doesn't matter who we grab
            let user = null;
            for (let userId in db.User.all) {
                user = db.User.all[userId];
                break;
            }

            // pull this user's PW hash
            let pw_hash = null;
            db.User.getPassword(user.id).then((password) => pw_hash = password.password_hash).then(() => {
                // required results
                expect(pw_hash.length).to.equal(60);
                expect(typeof pw_hash).to.equal("string");
                }
            );
        })
    })
});

describe("Conversation data manipulation", () => {

});

describe("Message adta manipulation", () => {

});