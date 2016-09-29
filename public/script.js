let user = {};
let users = {};
let textbox, to_box, message_list, user_list;
let socket = io();

addEventListener("load", function(){
    socket.emit("identifier", "bogus identifier");
});
addEventListener("DOMContentLoaded", ready);

function ready() {
    textbox = document.getElementById("message");
    to_box = document.getElementById("sendTo");
    to_id = document.getElementById("sendToId");
    message_list = document.getElementById("messages");
    user_list = document.getElementById("users");
    document.getElementById("submit").addEventListener("click", sendMsg);

    user.name = prompt("Please enter your name");
    socket.emit("user name", user.name);

    socket.on("user data", user_data);
    socket.on("user new", user_new);
    socket.on("message receive", message_new);

    function user_data(assigned_user) {
        user = assigned_user;
    }
    function user_new(new_user) {
        users[new_user.id] = new_user;
        let li = document.createElement("li");
        li.innerHTML = '<a href="#" class="user" id="'+new_user.id+'">' + new_user.name + '</a>';
        li.addEventListener("click", sendTo);
        user_list.appendChild(li);
    }
    function message_new(message) {
        let li = document.createElement("li");
        let text = document.createTextNode("<" + message.from + "> " + message.text);
        li.appendChild(text);
        message_list.appendChild(li);
    }
    function sendTo(event) {
        to_box.value = event.target.innerText;
        to_id.value = event.target.id;
    }
    function sendMsg() {
        let message = {
            "to" : to_id.value,
            "from" : user.id,
            "text" : textbox.value,
            "timestamp" : Date.now()
        };
        socket.emit("message send", message);
        textbox.value = "";
        let li = document.createElement("li");
        let new_message = document.createTextNode("<" + user.name + "> " + message.text);
        li.appendChild(new_message);
        message_list.append(li);
    }
}
