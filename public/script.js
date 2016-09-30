"use strict";
let user = {};
let users = {};
let textBox, toBox, toId, messageList, userList;
let socket = io();

addEventListener("load", function(){
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

    user.name = prompt("Please enter your name");
    socket.emit("user name", user.name);

    socket.on("user data", setUserData);
    socket.on("user new", addUser);
    socket.on("message receive", addMessage);
    socket.on("user list", updateUserList);

    function setUserData(assignedUser) {
        user = assignedUser;
        users[assignedUser.id] = user;
        let el = document.getElementById(user.id) || addUser(user);
        el.innerHTML = user.name;
    }
    function addUser(newUser) {
        users[newUser.id] = newUser;
        let li = document.createElement("li");
        li.innerHTML = '<a href="#" class="user" id="'+newUser.id+'">' + newUser.name + '</a>';
        li.addEventListener("click", sendTo);
        userList.appendChild(li);
        return li;
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
            "to" : toId.value,
            "from" : user.id,
            "text" : textBox.value,
            "timestamp" : Date.now()
        };
        socket.emit("message send", message);
        textBox.value = "";
        addMessage(message);
    }

    function updateUserList(userList) {
        users = userList;
        console.log(users);
        userList.innerHTML = '';
        for(var i = 0; i< userList.length; i++) {
            addUser(userList[i]);
        }
    }

}
