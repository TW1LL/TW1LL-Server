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
    for (let userId in db.User.all) {
        return db.User.all[userId];
    }
}

describe("db", () => {

});

describe("db.User", () => {

    before(() => {
       db.connect()
           .then((result) => console.log("result", result));
    });

    after(() => {
        db.close();
    });

    describe("saveFriends", () => {

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

    describe("getPassword", () => {

        it("Retrieves a 60 character password hash string for an existing user", () => {
            // get the first user - doesn't matter who we grab
            let user = getExistingUser();

            // pull this user's PW hash
            db.User.getPassword(user.id)
                .then((password) => {
                    let pw_hash = password.password_hash;
                    // required results
                    expect(pw_hash.length).to.equal(60);
                    expect(typeof pw_hash).to.equal("string");
                });
        });

        it("Returns false when given an invalid user id", () => {
            let userId = uuid.v1();
            db.User.getPassword(userId).then((result) => expect(result).to.equal(false));
        })
    });

    describe('findIdByEmail', () => {

        it("Returns an ID when given a valid email in the database", () => {
            let user = getExistingUser();
            db.User.findIdByEmail(user.email).then((userId) => {
                expect(userId).to.equal(user.id);
            })
        });

        it("Returns false when given an email that is not in the database", () => {
            let emailAddress = "invalidAddress";
            db.User.findIdByEmail(emailAddress).then((result) => expect(result).to.equal(false));
        });
    });

    describe("get", () => {

        it("Returns a User object when given an id for a user in the database", () => {
            let targetUser = getExistingUser();
            db.User.get(targetUser.id)
                .then((user) => expect(user).is.instanceOf(UserModel));
        });

        it("Returns false when given a user ID not in the database", () => {
            let userId = uuid.v1();
            db.User.get(userId).then((result) => expect(result).to.equal(false));
        })
    });

    describe("getAll", () => {
        it("Returns a list of users", () => {
            let notUserObject = [];
            db.User.getAll()
                .then((users) => {
                    for (let userId in users) {
                        if (!users[userId] instanceof UserModel){
                            notUserObject.push(users[userId]);
                        }
                    }
                })
                .then(() => {
                    expect(notUserObject.length).to.equal(0);
                })
        })
    });

    describe('createNewPassword', () => {

        it('Returns true when given a user id, salt, and password hash to create for a user without assigned password', () => {
            let userId = uuid.v1();
            let password = "testPassword";
            let createPWResult = null;
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password, salt, null, (err, hash) => {
                    db.User.createNewPassword(userId, salt, hash)
                        .then((result) => {
                            createPWResult = result;
                        });
                    setTimeout(()=>{
                        db.User.getPassword(userId).then((pwHash) => {
                        console.log("pw", pwHash);
                        db.User.deletePassword(userId);
                    })},
                        3000);
                })
            });
        })
    });

    describe("deleteUser", () => {
        it("Removes all of a user's data from the database and all user lists", () => {});
    })
});

describe("db.Conversation", () => {

});

describe("db.Message", () => {

});