(function() {
    "use strict";

    let users = {};
    let socket;
    let events, currentConversation, currentUserId;
    let storage = new Storage();
    let DOM = new Dom(storage);

    addEventListener("DOMContentLoaded", ready);

    function ready() {
        DOM.batchFind(
            ["messageBox", "friendList", "conversationMessages", "conversationList", "newConvButton", "newFriendButton",
                "loginModal","findFriendsModal", "modal-title", "findFriendsList", "findFriendsSubmit", "addFriendsLink",
                "loginSubmit", "loginEmail", "loginPassword",
                "registerSubmit", "registerEmail", "registerPassword", "registerPassword2", "registerError",
                "userInfo", "userInfoDropdown", "userInfoLink",
                "userLogout",
                "body-title", "body-text", "toggleFriendList", "toggleConversationList", "friends", "conversations", "sidepane"
            ]);
        DOM.modal.init();
        DOM.userInfoDropdown.hide();
        DOM.findFriendsModal.hide();
        DOM.find("submit").on("click", sendMsg);
        DOM.loginSubmit.on("click", login);
        DOM.findFriendsSubmit.on("click", addFriends);
        DOM.addFriendsLink.on("click", friendsModal);
        DOM.newConvButton.on("click", newConversation);
        DOM.addFriendsLink.hide();
        DOM.sidepane.hide();
        DOM.registerSubmit.on("click", register);
        DOM.toggleFriendList.on("click", DOM.toggleFriendConvList);
        DOM.toggleConversationList.on("click", DOM.toggleFriendConvList)
        DOM.registerSubmit.disabled = true;
        DOM.userInfoLink.on("click", loginModal);
        DOM.messageBox.on("keypress", checkForEnter);
        DOM.registerEmail.on("keyup", registerCheckEmail);
        DOM.registerPassword2.on("keyup", registerCheckPW);
        DOM.userLogout.on("click", logout);
        checkLoginStatus();
    }

    function connect() {
        socket = io.connect();
        socket.emit('authenticate', {token: storage.getUserToken()});
        socket.on("authenticated", authorized);
        socket.on("unauthorized", unauthorized);
    }
    function authorized() {
        socket.on("server events", init);
    }

    function unauthorized(error, callback) {
        if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
            sendError("User's token is invalid and requires new login");
        }
        storage.clearUser();
    }

    function init(eventList) {
        DOM.sidepane.show();
        events = eventList;
        socket.emit(events.clientConversationSync, [storage.getUserData(), storage.getConversations()]);
        //socket.on(events.serverUserConnect, addUser);
        socket.on(events.serverUserList, updateUserList);
        socket.on(events.serverUserData,  serverUserData);
        socket.on(events.serverMessageReceive, DOM.addMessage);
        socket.on(events.serverUserFriendsList, updateFriendsList);
        socket.on(events.serverConversationData, updateConversationData);
        updateConversationList();
        socket.on("disconnect", function(){
            socket.disconnect();
        })
    }

    function checkLoginStatus() {
        if (typeof storage.getUserToken() !== "undefined") {
            connect();
        }
    }

    function loginModal() {
        if (typeof storage.getUserToken() !== "undefined") {
            DOM.userInfoDropdown.toggle();
        } else {
            DOM.modal.open();
        }
    }
    function login(e) {
        let http = new XMLHttpRequest();
        http.open("POST", "/login/"+DOM.loginEmail.value+"/"+DOM.loginPassword.value, true);
        http.send();
        http.onload = function() {
            let res = JSON.parse(this.response);
            if (res.valid) {
                storage.setUser(res.data);
                storage.setUserToken(res.token);
                DOM.modal.close();
                connect();
            } else {
                sendError(res.data);
                storage.clearUser();

            }
        };
        e.preventDefault();
        return false;
    }

    function register(e) {
        let http = new XMLHttpRequest();
        http.open("POST", "/register/"+DOM.registerEmail.value+"/"+DOM.registerPassword.value, true);
        http.send();
        http.onload = function() {
            let res = JSON.parse(this.response);
            if (res.valid) {
                storage.setUser(res.data);
                storage.setUserToken(res.token);
                updateUserList(res.userList);
                DOM.modal.switch("findFriendsModal");
                connect();
            } else {
                sendError(res.data);
                storage.clearUser();
            }
        };
        e.preventDefault();
        return false;
    }

    function registerCheckPW() {
        if(DOM.registerPassword.value.length > 0) {
            if(DOM.registerPassword2.value == DOM.registerPassword.value) {
                if(registerCheckEmail()) {
                    DOM.registerSubmit.disabled = false;
                    DOM.registerError.innerText = '';
                }
            } else {
                DOM.registerError.innerText = "Passwords do not match";
            }
        } else {
            DOM.registerError.innerText = "Please enter a password";
        }
    }
    function registerCheckEmail() {
        if(DOM.registerEmail.value.length > 0) {
            if(DOM.registerEmail.value.indexOf("@") == -1) {
                DOM.registerError.innerText = "Please enter an email";
                return false;
            } else {
                DOM.registerError.innerText = '';
                return true;
            }
        } else {
            return false;
        }

    }

    function logout() {
        storage.clearUser();
        DOM.logout();
        socket.disconnect();

    }

    function sendError(message) {
        alert(message);
    }

    function Storage() {
        this.getUserData = getUserData;
        this.setUserData = setUserData;
        this.setUserToken = setUserToken;
        this.clearUser = clearUser;
        this.getUserToken = getUserToken;
        this.setUser = setUser;
        this.setUserFriends = setUserFriends;
        this.getUserFriends = getUserFriends;
        this.setConversation = setConversation;
        this.getConversation = getConversation;
        this.getConversations = getConversations;
        this.storeMessage = storeMessage;

        function getUserData(parameter) {
            if (typeof localStorage["user"] === "undefined"){
                localStorage["user"] = JSON.stringify({});
            }
            if (typeof parameter !== "undefined") {
                return JSON.parse(localStorage["user"])[parameter];
            } else {
                return JSON.parse(localStorage["user"])
            }
        }
        function setUserData(parameter, data) {
            let user = storage.getUserData();
            user[parameter] = data;
            localStorage["user"] = JSON.stringify(user);
        }

        function setUserToken(token) {
            localStorage["userToken"] = token;

        }

        function clearUser() {
            localStorage.removeItem('userToken');
            localStorage["user"] = JSON.stringify({});
        }

        function getUserToken() {
            return localStorage["userToken"];
        }

        function setUser(user) {
            localStorage["user"] = JSON.stringify(user);
            DOM.userInfoLink.innerText = user.email;
        }

        function setUserFriends(friends) {
            localStorage["friends"] = JSON.stringify(friends);
        }

        function getUserFriends() {
            return JSON.parse(localStorage["friends"]);
        }

        function setConversation(conv) {
            localStorage[conv.id] = JSON.stringify(conv);
        }

        function getConversation(convId) {
            if (typeof localStorage[convId] !== "undefined") {
                return JSON.parse(localStorage[convId]);
            } else {
                return false;
            }
        }

        function getConversations() {
            let convs = {};
            for (var key in localStorage) {
                if (key != "user" && key != "userToken" && key != "friends") {
                    convs[key] = localStorage[key];
                }
            }
            return convs;
        }

        function storeMessage(message) {
            let conversation = {};
            // pull existing conversation if there is one
            if (storage.getConversation(message.conversationId) !== false) {
                conversation = storage.getConversation(message.conversationId);
            }
            conversation.push(message);
            storage.setConversation(conversation);
        }

    }

    function serverUserData(data) {
        updateFriendsList(data.friendsList, "friendList");
        //updateConversationList(data.conversations);
        storage.setUser(data.userData);
        DOM.userInfoLink.innerText = data.userData.email;

    }


    function newConversation(e) {
        DOM["body-title"].innerHTML = '<h4>Start a new conversation</h4>';
        DOM["body-text"].innerHTML = '' +
            '<p>Select friends to add to the conversation:</p>' +
            '<ul id="convFriendList"></ul>' +
            '<button id="createConversationButton">Create Conversation</button>';
        DOM.find("convFriendList");
        DOM.find("createConversationButton");
        DOM.createConversationButton.on("click", createConversation);
        updateList(storage.getUserFriends(), "convFriendList", "checkbox");

        //
    }

    function createConversation() {
        console.log("Sending Data to server...");
        var checkboxes = document.querySelectorAll('#convFriendList input[name="addFriend"]:checked');
        var members = [], el;
        Array.prototype.forEach.call(checkboxes, function(el) {
            members.push(el.value);
        });
        members.push(storage.getUserData("id"));
        var data = {
            userId: storage.getUserData("id"),
            users: members
        };
        socket.emit(events.clientConversationCreate, data);
    }






    function updateConversationData(conv) {
        storage.setConversation(conv);
        if(!DOM.find("conv_" + conv.id)) {
            DOM.createConversation(conv, convClickCallback);
        }  else {
            DOM.updateConversation(conv);
        }
    }

    function updateConversationList(convs) {

    }
    function userClickCallback(event) {
        currentUserId = event.target.parentElement.id;
    }

    function convClickCallback(event) {
        currentConversation = event.target.id.substr(5);

        DOM.showConversation(storage.getConversation(currentConversation));
    }

    function checkForEnter(event) {
        if (event.keyCode == 13) {
            sendMsg();
        }
    }

    function sendMsg() {
        let message = {
            "from": storage.getUserData("id"),
            "text": DOM.messageBox.value,
            "timestamp": Date.now(),
            "conversationId": currentConversation
        };
        socket.emit(events.clientMessageSend, message);
        DOM.messageBox.value = "";
        DOM.addMessage(message);
        storeMessage(message);
    }

    function updateUserList(list) {
        updateList(list, "findFriendsList", "checkbox");
        DOM.modal.switch("findFriendsModal");
    }


    function friendsModal() {
        DOM.modal.open();
        DOM.modal.switch("findFriendsModal");
        socket.emit(events.clientUserList, storage.getUserData("id"));
    }
    function addFriends() {
        console.log("adding friends...");
        var checkboxes = document.querySelectorAll('input[name="addFriend"]:checked');
        var friends = [], el;
        Array.prototype.forEach.call(checkboxes, function(el) {
            friends.push(el.value);
        });
        var data = {
            id: storage.getUserData("id"),
            friends: friends
        };
        socket.emit(events.clientUserFriendAdd, data);
        DOM.modal.close();
    }

    function updateFriendsList(friends) {
        storage.setUserFriends(friends);
        updateList(friends, "friendList", "link");
    }

    function updateList(list, location, type) {
        DOM[location].innerHTML = '';
        if(typeof type === "undefined") {
            type = "link";
        }
        for (let i in list) {
            DOM.addUser(list[i], userClickCallback, type, location);
        }
    }
    function updateConversationList() {
        let conversations = storage.getConversations();
        for (var i in conversations) {
            let conv = {
                id: conversations[i].id,
                name: conversations[i].name
            }
            DOM.createConversationLink(conv, convClickCallback);
        }
    }
})();