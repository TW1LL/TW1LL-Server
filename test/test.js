"use strict";

// database startup and classes
let db = require('./../db/Database');
let User = require('./../db/User');
let Conversation = require('./../db/Conversation');
let Message = require('./../db/Message');

// model classes
let UserModel = require('./../Models/User');
let ConversationModel = require('./../Models/Conversation');
let MessageModel = require('./../Models/Message');

let uuid = require('uuid');
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
    });

    describe("Save friends for a user", () => {

        it("Returns true and correctly saves friends when given a valid user object", () => {
            // get the first user, we don't care which one
            let user = {};
            for (let userId in db.User.all) {
                user = db.User.all[userId];
            }
            db.User.saveFriends(user)
                .then((result) => {
                    expect(result).to.equal(true);
                })
        });

        it("Returns false when given a user object for a user who does not exist", () => {
            let user = new UserModel({
                id: uuid.v1(),
                email: "mochaTest@testsuite.com",
                nickname: "mocha",
                friends: [],
                conversations: []
            });
            db.User.saveFriends(user)
                .then((result) => {
                    expect(error).to.equal(false);
                })
                .catch((error) => {
                    expect(error).to.equal(false);
                })
        });

        it("Returns false when passed a pseudo-object without user id", () => {
            let user = new UserModel({
                id: '',
                email: "mochaTest@testsuite.com",
                nickname: "mocha",
                friends: [],
                conversations: []
            });
            db.User.saveFriends(user)
                .catch((error) => {expect(error).to.equal(false)});
        });
    });

    describe("Delete a user", () => {
        it("Removes all of a user's data from the database and all user lists", () => {});
    })
});

describe("Conversation data manipulation", () => {

});

describe("Message adta manipulation", () => {

});