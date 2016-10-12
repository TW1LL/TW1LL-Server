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
let bcrypt = require('bcrypt-nodejs');
let expect = require('chai').expect;

function getExistingUser() {
    // get the first user - doesn't matter who we grab
    return new Promise ((resolve) => {
        for (let userId in db.User.all) {
            return resolve(db.User.all[userId]);
        }
    })
}

describe("db", () => {});

describe("db.User", () => {

    before(() => {db.connect()});

    after(() => {
        db.close();
    });

    describe("saveFriends", () => {

        it("Returns true and correctly saves friends when given a valid user object", function(){
            this.timeout(3000);
            return getExistingUser()
                .then((user) => db.User.saveFriends(user))
                .then((result) => {
                        expect(result).to.equal(true);
                })
        });

        it("Returns false when given a user object for a user who does not exist", function(){
            let user = new UserModel({
                id: uuid.v1(),
                email: "mochaTest@testsuite.com",
                nickname: "mocha",
                friends: [],
                conversations: []
            });

            return db.User.saveFriends(user)
                .catch((result) => {expect(result).equal("User doesn't exist.")})
        });

        it("Returns false when passed a pseudo-object without user id", function(){
            let user = new UserModel({
                id: '',
                email: "mochaTest@testsuite.com",
                nickname: "mocha",
                friends: [],
                conversations: []
            });
            return db.User.saveFriends(user)
                .catch((result) => {expect(result).equal("User doesn't exist.")});
        });
    });

    describe("getPassword", () => {

        it("Retrieves a 60 character password hash string for an existing user", function(){
            // get the first user - doesn't matter who we grab
            return getExistingUser()
                .then((user) => {
                    // pull this user's PW hash
                    db.User.getPassword(user.id)
                        .then((password) => {
                            let pw_hash = password.password_hash;
                            // required results
                            expect(pw_hash.length).to.equal(60);
                            expect(typeof pw_hash).to.equal("string");
                        })
                        .catch(() => {expect(false).equal(true)});
            })
        });

        it("Returns false when given an invalid user id", function(){
            let userId = uuid.v1();
            return db.User.getPassword(userId)
                .catch((result) => {expect(result).equal("User ID does not exist.")});
        })
    });

    describe('findIdByEmail', () => {

        it("Returns an ID when given a valid email in the database", function(){
            return getExistingUser()
                .then((user) => {
                    db.User.findIdByEmail(user.email)
                        .then((userId) => {
                            expect(userId).to.equal(user.id);
                        })
            })
        });

        it("Returns false when given an email that is not in the database", function(){
            let emailAddress = "invalidAddress";
            return db.User.findIdByEmail(emailAddress)
                .catch((result) => {expect(result).equal("User does not exist with that email address.")});
        });
    });

    describe("get", () => {

        it("Returns a User object when given an id for a user in the database", function(){
            return getExistingUser()
                .then((targetUser) => {
                    db.User.get(targetUser.id)
                        .then((user) => expect(user).is.instanceOf(UserModel))
                })
        });

        it("Returns false when given a user ID not in the database", function(){
            let userId = uuid.v1();
            return db.User.get(userId)
                .catch((result) => {expect(result).equal("User does not exist with that ID.")});
        })
    });

    describe("getAll", () => {

        it("Returns a list of users", function(){
            let notUserObject = [];
            return db.User.getAll()
                .then((users) => {
                    for (let userId in users) {
                        if (!users[userId] instanceof UserModel){
                            notUserObject.push(users[userId]);
                        }
                    }
                })
                .then(() => {expect(notUserObject.length).to.equal(0);})
        })
    });

    describe('createNewPassword', () => {

        it('Saves a given password salt and hash with appropriate ID to the user_passwords table', function(){
            let userId = uuid.v1();
            let password = "testPassword";
            let createPWResult = null;
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, null, (err, hash) => {
                    console.log("here");
                    db.User.createNewPassword(userId, salt, hash)
                        .then((result) => {
                            console.log("but not here");
                            createPWResult = result;
                            console.log("result?", createPWResult);
                        })
                        .then(() => {db.User.getPassword(userId)})
                        .then((pwHash) => {
                            console.log("pw", pwHash);
                            expect(pwHash).to.equal(hash);
                            // db.User.deletePassword(userId);
                        });
                })
            });
        })
    });

    describe("deleteUser", () => {
        it("Removes all of a user's data from the database and all user lists", function(){});
    })
});

describe("db.Conversation", () => {

});

describe("db.Message", () => {

});