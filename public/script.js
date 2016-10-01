(function() {
    "use strict";

    let users = {};
    let textBox, toBox, toId, messageList, userList;
    let socket = io();
    let events;

    addEventListener("load", function () {
        socket.emit("identifier", "bogus identifier");
    });
    addEventListener("DOMContentLoaded", ready);

    function ready() {

        textBox = document.getElementById("message");
        toBox = document.getElementById("sendTo");
        messageList = document.getElementById("messages");
        userList = document.getElementById("users");
        document.getElementById("submit").addEventListener("click", sendMsg);
        textBox.addEventListener("keypress", checkForEnter);
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

    function assignUser(userData) {
        setUserData("id", userData.id);
        setUser(userData);
        users[userData.id] = userData;
        let el = document.getElementById(userData.id) || addUser(userData);
        el.innerHTML = '<a href="#" class="user">' + userData.name + '</a>';
    }

    function getUserData(parameter) {
        if (typeof parameter !== "undefined") {
            return JSON.parse(localStorage["user"])[parameter];
        } else {
            return JSON.parse(localStorage["user"])
        }
    }

    function setUserData(parameter, data) {
        let user = getUserData();
        user[parameter] = data;
        localStorage["user"] = JSON.stringify(user);
    }

    function setUser(user){
        localStorage["user"] = JSON.stringify(user);
    }

    function requestUser(socketId) {
        // make sure there's a user in local storage
        if (typeof localStorage["user"] === "undefined"){
            localStorage["user"] = JSON.stringify({});
        }
        setUserData("socketId", socketId);
        if (typeof getUserData("name") === "undefined") {
            let name = prompt("Please enter your name: ");
            setUserData("name", name);
        }
        socket.emit(events.clientUserData, getUserData());
    }

    function addUser(userData) {
        users[userData.id] = userData;
        let li = document.createElement("li");
        li.setAttribute("id", userData.id);
        li.innerHTML = '<a href="#" class="user">' + userData.name + '</a>';
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
        let li = document.createElement("li");
        let text = document.createTextNode("<" + users[message.from].name + "> " + message.text);
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