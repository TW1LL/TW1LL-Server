(function() {
    "use strict";

    let users = {};
    let socket;
    let events, toConvId;
    let DOM = new Dom();

    addEventListener("DOMContentLoaded", ready);

    function ready() {
        DOM.batchFind(
            ["messageBox", "friendList", "messageList", "conversationList", "newConvButton",
                "loginModal","findFriendsModal", "modal-title", "findFriendsList", "findFriendsSubmit", "addFriendsLink",
                "loginSubmit", "loginEmail", "loginPassword",
                "registerSubmit", "registerEmail", "registerPassword", "registerPassword2", "registerError",
                "userInfo", "userInfoDropdown", "userInfoLink",
                "userLogout",
                "body-title", "body-text"
            ]);
        DOM.modal.init();
        DOM.userInfoDropdown.hide();
        DOM.findFriendsModal.hide();
        DOM.find("submit").on("click", sendMsg);
        DOM.loginSubmit.on("click", login);
        DOM.findFriendsSubmit.on("click", addFriends);
        DOM.addFriendsLink.on("click", friendsModal);
        DOM.newConvButton.on("click", newConversation);
        DOM.registerSubmit.on("click", register);
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
        socket.emit('authenticate', {token: getUserToken()});
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
    }

    function init(eventList) {
        events = eventList;
        socket.emit(events.clientConversationSync, [getUserData(), getConversations()]);
        //socket.on(events.serverUserConnect, addUser);
        socket.on(events.serverUserList, updateUserList);
        socket.on(events.serverUserDisconnect, removeUser);
        socket.on(events.serverUserData,  serverUserData);
        socket.on(events.serverMessageReceive, addMessage);
        socket.on(events.serverUserFriendsList, updateFriendsList);
        socket.on(events.serverConversationData, updateConversationData);

        socket.on("disconnect", function(){
            socket.disconnect();
        })
    }

    function checkLoginStatus() {
        if (typeof getUserToken() !== "undefined") {
            connect();
        }
    }

    function loginModal() {
        if (typeof getUserToken() !== "undefined") {
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
                setUser(res.data);
                setUserToken(res.token);
                DOM.modal.close();
                connect();
            } else {
                sendError(res.data);
                clearUser();

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
                setUser(res.data);
                setUserToken(res.token);
                updateUserList(res.userList);
                DOM.modal.switch("findFriendsModal");
                connect();
            } else {
                sendError(res.data);
                clearUser();
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
        clearUser();
        socket.disconnect();
        DOM.userInfoLink.innerText = "Login / Register";
        DOM.conversationList.innerHTML = '';
        DOM.messageList.innerHTML = '';
        DOM.userInfoDropdown.hide();
        DOM.modal.switch("loginModal");
    }
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

    function sendError(message) {
        alert(message);
    }
    function setUserData(parameter, data) {
        let user = getUserData();
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
    function setUser(user){
        localStorage["user"] = JSON.stringify(user);
        DOM.userInfoLink.innerText = user.email;
    }
    function setUserFriends(friends) {
        localStorage["friends"] = JSON.stringify(friends);
    }
    function getUserFriends() {
        return JSON.parse(localStorage["friends"]);
    }

    function serverUserData(data) {
        updateFriendsList(data.friendsList, "friendList");
        //updateConversationList(data.conversations);
        setUser(data.userData);
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
        updateList(getUserFriends(), "convFriendList", "checkbox");

        //
    }

    function createConversation() {
        console.log("Sending Data to server...");
        var checkboxes = document.querySelectorAll('#convFriendList input[name="addFriend"]:checked');
        var members = [], el;
        Array.prototype.forEach.call(checkboxes, function(el) {
            members.push(el.value);
        });
        members.push(getUserData("id"));
        var data = {
            userId: getUserData("id"),
            users: members
        };
        console.log(data);
        socket.emit(events.clientConversationCreate, data);
    }
    function newGroupConversation() {

    }
    function removeUser(userData) {
        console.log("User disconnected", userData);
        let userDisplay = document.getElementById(userData.id);
        delete users[userData.id];
        DOM.conversationList.removeChild(userDisplay);
    }

    function addMessage(message) {
        let li = document.createElement("li");
        let text = document.createTextNode("<" + users[message.from].email + "> " + message.text);
        li.appendChild(text);
        DOM.messageList.appendChild(li);
        storeMessage(message);
    }

    function storeMessage(message) {
        let conversation = {};
        // pull existing conversation if there is one
        if (getConversation(message.conversationId) !== false) {
            conversation = getConversation(message.conversationId);
        }
        conversation.push(message);
        setConversation(conversation);
    }

    function setConversation(conv) {
        localStorage[conv.id] = JSON.stringify(conv);
    }
    function getConversation(convId) {
        if (typeof localStorage[convId] !== "undefined") {
            return localStorage[convId];
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

    function updateConversationData(conv) {
        setConversation(conv);
        if(!DOM.find("conv_" + conv.id)) {
            DOM.createConversation(conv);
        }  else {
            DOM.updateConversation(conv);
        }
    }

    function updateConversationList(convs) {

    }
    function userClickCallback(event) {
        toConvId = event.target.parentElement.id;
    }


    function checkForEnter(event) {
        if (event.keyCode == 13) {
            sendMsg();
        }
    }

    function sendMsg() {
        let message = {
            "from": getUserData("id"),
            "text": DOM.messageBox.value,
            "timestamp": Date.now(),
            "conversationId": toConvId
        };
        socket.emit(events.clientMessageSend, message);
        DOM.messageBox.value = "";
        addMessage(message);
        storeMessage(message);
    }

    function updateUserList(list) {
        updateList(list, "findFriendsList", "checkbox");
        DOM.modal.switch("findFriendsModal");
    }


    function friendsModal() {
        DOM.modal.open();
        DOM.modal.switch("findFriendsModal");
        socket.emit(events.clientUserList, getUserData("id"));
    }
    function addFriends() {
        console.log("adding friends...");
        var checkboxes = document.querySelectorAll('input[name="addFriend"]:checked');
        var friends = [], el;
        Array.prototype.forEach.call(checkboxes, function(el) {
            friends.push(el.value);
        });
        var data = {
            id: getUserData("id"),
            friends: friends
        };
        socket.emit(events.clientUserFriendAdd, data);
        DOM.modal.close();
    }

    function updateFriendsList(friends) {
        setUserFriends(friends);
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
})();