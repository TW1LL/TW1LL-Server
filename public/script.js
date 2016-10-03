(function() {
    "use strict";

    let users = {};
    let socket;
    let events, toId;
    let DOM = new Dom();

    addEventListener("DOMContentLoaded", ready);

    function ready() {
        DOM.batchFind(["messageBox", "toBox", "messageList", "userList", "loginForm", "loginEmail", "loginPassword", "userInfo"]);
        DOM.userInfo.style.display = "none";
        DOM.find("submit").on("click", sendMsg);
        DOM.find("loginSubmit").on("click", login);
        DOM.find("registerSubmit").on("click", register);
        DOM.messageBox.on("keypress", checkForEnter);
        checkLoginStatus();
    }

    function connect() {
        socket = io.connect();
        socket.emit('authenticate', {token: getUserToken()});
        socket.on("authenticated", authorized);
        socket.on("unauthorized", unauthorized);
    }
    function authorized() {
        console.log('user authorized! at ' + Date.now());
        DOM.loginForm.hide();
        DOM.userInfo.show();
        socket.on("server events", init);
    }

    function unauthorized(error, callback) {
        if (error.data.type == "UnauthorizedError" || error.data.code == "invalid_token") {
            sendError("User's token is invalid and requires new login");
        }

    }
    function init(eventList) {
        console.log('User connected');
        events = eventList;
        socket.on(events.serverUserData2, assignUser);
        socket.on(events.serverUserConnect, addUser);
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

    function login() {
        let http = new XMLHttpRequest();
        http.open("POST", "/login/"+DOM.loginEmail.value+"/"+DOM.loginPassword.value, true);
        http.send();
        http.onload = function() {
            let res = JSON.parse(this.response);
            if (res.valid) {
                setUserToken(res.token);
                connect();
            } else {
                sendError(res.message);
            }
        }
    }

    function register() {
        let http = new XMLHttpRequest();
        http.open("POST", "/register/"+DOM.loginEmail.value+"/"+DOM.loginPassword.value, true);
        http.send();
        http.onload = function() {
            let res = JSON.parse(this.response);
            if (res.valid) {
                setUserToken(res.token);
                connect();
            } else {
                sendError(res.message);
            }
        }
    }

    function assignUser(userData) {
        setUserData("id", userData.id);
        setUser(userData);
        users[userData.id] = userData;
        let el = DOM.find(userData.id) || addUser(userData);
        el.innerHTML = '<a href="#" class="user">' + userData.email + '</a>';
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
    function getUserToken() {
        return localStorage["userToken"];
    }
    function setUser(user){
        localStorage["user"] = JSON.stringify(user);
    }

    function serverUserData(userData) {
        setUser(userData);
        let el = DOM.find(userData.id) || addUser(userData);
        el.innerHTML = '<a href="#" class="user">' + userData.email + '</a>';
        DOM.userInfo.innerHTML = '<a href="#">' + userData.email + '</a>';
    }

    function addUser(userData) {
        users[userData.id] = userData;
        let li = document.createElement("li");
        li.setAttribute("id", userData.id);
        li.innerHTML = '<a href="#" class="user">' + userData.email + '</a>';
        DOM.userList.appendChild(li);
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
    }

    function sendTo(event) {
        DOM.toBox.value = event.target.innerText;
        toId = on.target.parentElement.id;
    }

    function checkForEnter(event) {
        if (event.keyCode == 13) {
            sendMsg();
        }
    }
    function sendMsg() {
        let message = {
            "to": toId,
            "from": getUserData("id"),
            "text": DOM.messageBox.value,
            "timestamp": Date.now()
        };
        socket.emit(events.clientMessageSend, message);
        DOM.messageBox.value = "";
        addMessage(message);
    }

    function updateUserList(list) {
        users = list;
        DOM.userList.innerHTML = '';
        for (let i in list) {
            addUser(list[i]);
        }
    }

})();