(function() {
    "use strict";

    let users = {};
    let socket;
    let events, toConvId;
    let DOM = new Dom();

    addEventListener("DOMContentLoaded", ready);

    function ready() {
        DOM.batchFind(
            ["messageBox", "toBox", "messageList", "userList",
                "loginModal","findFriendsModal", "modal-title", "findFriendsList", "findFriendsSubmit",
                "loginSubmit", "loginEmail", "loginPassword",
                "registerSubmit", "registerEmail", "registerPassword", "registerPassword2", "registerError",
                "userInfo", "userInfoDropdown", "userInfoLink",
                "userLogout"
            ]);
        DOM.modal.init();
        DOM.userInfoDropdown.hide();
        DOM.findFriendsModal.hide();
        DOM.find("submit").on("click", sendMsg);
        DOM.loginSubmit.on("click", login);
        DOM.findFriendsSubmit.on("click", addFriends);
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
        //socket.on(events.serverUserConnect, addUser);
        socket.on(events.serverUserList, updateUserList);
        socket.on(events.serverUserDisconnect, removeUser);
        socket.on(events.serverUserData,  serverUserData);
        socket.on(events.serverMessageReceive, addMessage);
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
        DOM.userList.innerHTML = '';
        DOM.messageList.innerHTML = '';
        DOM.userInfoDropdown.hide();
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

    function serverUserData(userData) {
        setUser(userData);
        DOM.userInfoLink.innerText = userData.email;
    }

        function addUser(userData, where) {
            users[userData.id] = userData;
            let li = document.createElement("li");
            li.setAttribute("id", userData.id);
            li.innerHTML = '<input type="checkbox" name="addFriend" value="'+userData.id+'">' + userData.email + '</a>';
            DOM[where].appendChild(li);
            li.addEventListener("click", sendTo);
            return li;
    }

    function removeUser(userData) {
        console.log("User disconnected", userData);
        let userDisplay = document.getElementById(userData.id);
        delete users[userData.id];
        DOM.userList.removeChild(userDisplay);
    }

    function addMessage(message) {
        let li = document.createElement("li");
        let text = document.createTextNode("<" + users[message.from].email + "> " + message.text);
        li.appendChild(text);
        DOM.messageList.appendChild(li);
        storeMessage(message);
    }

    function storeMessage(message) {
        let allMessages = {};
        // pull existing list of messages if there is one
        if (typeof localStorage["messages"] !== "undefined") {
            allMessages = JSON.parse(localStorage["messages"]);
        }
        // if this conversation doesn't exist yet, create it
        if (typeof allMessages[message.from] === "undefined") {
            allMessages[message.from] = []
        }
        allMessages[message.from].push(message);
        localStorage["messages"] = JSON.stringify(allMessages);
    }

    function sendTo(event) {
        DOM.toBox.value = event.target.innerText;
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
        users = list;
        DOM.userList.innerHTML = '';
        for (let i in list) {
            addUser(list[i], "findFriendsList");
        }
        DOM.modal.switch("findFriendsModal");
    }

    function addFriends() {
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
    }
})();