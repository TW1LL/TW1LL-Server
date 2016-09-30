(function() {
    "use strict";

    let user = {};
    let users = {};
    let textBox, toBox, toId, messageList, userList;
    let socket = io();

    addEventListener("load", function () {
        socket.emit("identifier", "bogus identifier");
    });
    addEventListener("DOMContentLoaded", ready);

    function ready() {

        textBox = document.getElementById("message");
        toBox = document.getElementById("sendTo");
        toId = document.getElementById("sendToId");
        messageList = document.getElementById("messages");
        userList = document.getElementById("users");
        document.getElementById("submit").addEventListener("click", sendMsg);
    }

    function init() {
        socket.emit("client user name", user.name);
        socket.on("server user data", assignUser);
        socket.on("server user connected", addUser);
        socket.on("server message receive", addMessage);
        socket.on("server user list", updateUserList);
        socket.on("server user disconnect", removeUser);
        socket.on("server user request", requestUser);
    }

    function assignUser(userData) {
        console.log(userData);
        user = userData;
        users[user.id] = user;
        let el = document.getElementById(user.id) || addUser(user);
        el.innerHTML = '<a href="#" class="user">' + user.name + '</a>';
    }

    function getUserData(parameter) {
        if (typeof parameter !== "undefined") {
            return JSON.parse(localStorage["user"])[parameter];
        } else {
            return JSON.parse(localStorage["user"])
        }
    }

    function setUserData(parameter, data) {
        user = getUserData();
        user[parameter] = data;
        localStorage["user"] = JSON.stringify(user);
    }

    function requestUser(socketId) {
        // make sure there's a user in local storage
        if (typeof localStorage["user"] === "undefined"){
            localStorage["user"] = JSON.stringify({});
        }
        setUserData("socket", socketId);
        if (typeof getUserData("name") === "undefined") {
            let name = prompt("Please enter your name: ");
            setUserData("name", name);
        }
        socket.emit(getUserData);
    }

    function addUser(newUser) {
        users[newUser.id] = newUser;
        let li = document.createElement("li");
        li.setAttribute("id", newUser.id);
        li.innerHTML = '<a href="#" class="user">' + newUser.name + '</a>';
        li.addEventListener("click", sendTo);
        userList.appendChild(li);
        return li;
    }

    function removeUser(userData) {
        console.log("User disconnected", userData);
        let userDisplay = document.getElementById(userData.id);
        console.log(userDisplay, userList);
        userList.removeChild(userDisplay);
    }

    function addMessage(message) {
        console.log(message);
        let li = document.createElement("li");
        let text = document.createTextNode("<" + users[message.from].name + "> " + message.text);
        li.appendChild(text);
        messageList.appendChild(li);
    }

    function sendTo(event) {
        toBox.value = event.target.innerText;
        toId.value = event.target.id;
    }

    function sendMsg() {
        let message = {
            "to": toId.value,
            "from": user.id,
            "text": textBox.value,
            "timestamp": Date.now()
        };
        socket.emit("message send", message);
        textBox.value = "";
        addMessage(message);
    }

    function updateUserList(userList) {
        users = userList;
        userList.innerHTML = '';
        for (var i = 0; i < userList.length; i++) {
            addUser(userList[i]);
        }
    }

    init()

})();