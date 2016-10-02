(function() {
    "use strict";

    let users = {};
    let textBox, toBox, toId, messageList, userList, userInfo, loginForm, loginEmail, loginPassword;
    let socket;
    let events;

    addEventListener("DOMContentLoaded", ready);

    function ready() {

        textBox = document.getElementById("message");
        toBox = document.getElementById("sendTo");
        messageList = document.getElementById("messages");
        userList = document.getElementById("users");
        loginForm = document.getElementById("loginForm");
        loginEmail = document.getElementById("loginEmail");
        loginPassword = document.getElementById("loginPassword");
        userInfo = document.getElementById("userInfo");
        userInfo.style.display = "none";
        document.getElementById("submit").addEventListener("click", sendMsg);
        document.getElementById("loginSubmit").addEventListener("click", login);
        textBox.addEventListener("keypress", checkForEnter);
    }

    function connect() {
        socket = io.connect('', { query: 'token=' + getUserToken() });
        userInfo.innerHTML = '<a href="#">'+loginEmail.value+'</a>';
        setUserData("email", loginEmail.value);
        loginForm.style.display = "none";
        userInfo.style.display = "initial";
        socket.on("server events", init);
    }

    function init(eventList) {
        events = eventList;
        socket.on(events.serverUserData, assignUser);
        socket.on(events.serverUserConnect, addUser);
        socket.on(events.serverUserList, updateUserList);
        socket.on(events.serverUserDisconnect, removeUser);
        socket.on(events.serverUserRequest, requestUser);
        socket.on(events.serverMessageReceive, addMessage);
        socket.on("disconnect", function(){
            socket.disconnect();
        })
    }

    function login() {
        let http = new XMLHttpRequest();
        http.open("POST", "/login/"+loginEmail.value+"/"+loginPassword.value, true);
        http.send();
        http.onload = function() {
            let res = JSON.parse(this.response);
            if (typeof res.token !== "undefined") {
                setUserToken(res.token);
                connect();
            } else {
                sendError('Failed to login');
            }
        }
    }

    function assignUser(userData) {
        setUserData("id", userData.id);
        setUser(userData);
        users[userData.id] = userData;
        let el = document.getElementById(userData.id) || addUser(userData);
        el.innerHTML = '<a href="#" class="user">' + userData.name + '</a>';
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

    function requestUser(socketId) {
        setUserData("socketId", socketId);
        socket.emit(events.clientUserData, getUserData());
    }

    function addUser(userData) {
        users[userData.id] = userData;
        let li = document.createElement("li");
        li.setAttribute("id", userData.id);
        li.innerHTML = '<a href="#" class="user">' + userData.email + '</a>';
        li.addEventListener("click", sendTo);
        userList.appendChild(li);
        return li;
    }

    function removeUser(userData) {
        console.log("User disconnected", userData);
        let userDisplay = document.getElementById(userData.id);
        delete users[userData.id];
        userList.removeChild(userDisplay);
    }

    function addMessage(message) {
        let li = document.createElement("li");
        let text = document.createTextNode("<" + users[message.from].email + "> " + message.text);
        li.appendChild(text);
        messageList.appendChild(li);
    }

    function sendTo(event) {
        toBox.value = event.target.innerText;
        toId = event.target.parentElement.id;
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
            "text": textBox.value,
            "timestamp": Date.now()
        };
        socket.emit(events.clientMessageSend, message);
        textBox.value = "";
        addMessage(message);
    }

    function updateUserList(list) {
        users = list;
        userList.innerHTML = '';
        for (let i in list) {
            addUser(list[i]);
        }
    }

})();