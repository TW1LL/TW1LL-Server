"use strict";

function Dom(storage) {
    var self = this;
    self.find = find;
    self.batchFind = batchFind;
    self.modal = new modal(self);
    self.addUser = addUser;
    self.createConversation =  createConversation;
    self.createConversationLink = createConversationLink;
    self.showConversation = showConversation;
    self.toggleFriendConvList = toggleFriendConvList;
    self.updateConversation = updateConversationMessages
    self.addMessage = addMessage;
    self.logout = logout;
    self.clearBody = clearBody;
    function find(id) {
        if (typeof self[id] === "undefined") {
            return build(id);
        } else {
            return self[id];
        }
    }
    function batchFind(list){
        for (var i in list) {
            self.find(list[i]);
        }
    }
    function build(id) {
        if (document.getElementById(id) !== null) {
            self[id] = document.getElementById(id);
        } else if (document.getElementsByClassName(id).length > 0 ) {
            self[id] = document.getElementsByClassName(id)[0];
        } else {
            return false;
        }
        self[id].tmp = {};
        self[id].on = on;
        self[id].hide = hide;
        self[id].show = show;
        self[id].toggle = toggle;
        self[id].clear = clear;
        function toggle() {
            if (self[id].style.display == "none") {
                    self[id].show();
            } else {
                self[id].hide();
            }
        }
        function hide() {
            self[id].tmp.display = window.getComputedStyle(self[id]).getPropertyValue("display");
            self[id].style.display = "none";
        }
        function show() {
            self[id].style.display = self[id].tmp.display || "initial";
        }
        function on(event, fn) {
            self[id].addEventListener(event, fn);
        }''
        function clear() {
            self[id].innerHTML = '';
        }
        return self[id];
    }

    function modal() {
        var mdl = this;
        mdl.current = "loginModal";
        mdl.init = function() {
            self.find("Modal");
            mdl.close();
            self.find("modal-close").on("click", mdl.close);
            self.find("modal-close-X").on("click", mdl.close);
        };
        mdl.close = function() {
            self["Modal"].hide();
        };
        mdl.open = function() {
            self["Modal"].show();
        };
        mdl.switch = function(id) {
            self[mdl.current].hide();
            self[id].show();
            mdl.current = id;
            self["modal-title"].innerText = mdl.modals[mdl.current].title;
        };

        mdl.modals = {
            "loginModal": {
                "title": "Login or Register"
            },
            "findFriendsModal": {
                "title": "Find your friends"
            },
        };
        return mdl;
    }

    function addUser(userData, sendTo, type, where) {
        let li = document.createElement("li");
        li.setAttribute("data-userId", userData.id);
        if(type == "checkbox") {
            li.innerHTML = '<input type="checkbox" name="addFriend" value="'+userData.id+'">' + userData.email + '</a>';
        } else if (type == "link") {
            li.innerHTML = '<a href="#">' + userData.email + '</a>';
        }
        li.addEventListener("click", sendTo);
        self[where].appendChild(li);
    }

    function addMessage(message) {
        console.log("message received", message);
        if(message.from == storage.getUserData("id")) {
            message.fromEmail = storage.getUserData("email");
        } else {
            message.fromEmail = storage.getUserFriends()[message.from].email;
        }
        let li = document.createElement("li");
        li.innerHTML = '<<a href="#" data-userId="'+message.from+'">' + message.fromEmail + '</a>> ' + message.text;
        try {
            self["conv_"+message.conversationId].appendChild(li);
        }
        catch (TypeError) {
            // create the conversation for the message
            console.log('no conversation for message');
        }
        storage.storeMessage(message);
    }
    function createConversationLink(conv, callback) {
        let li = document.createElement("li");
        li.setAttribute("id", "link_" + conv.id);
        li.setAttribute("class", "convLink");
        li.innerHTML = conv.name;
        li.addEventListener("click", callback);
        self.conversationList.appendChild(li);
    }
    function createConversation(conv, callback) {
        createConversationLink(conv, callback);

        let ul = document.createElement("ul");
        ul.setAttribute("id", "conv_"+conv.id);
        ul.setAttribute("class", "convMessages");
        for(var i in conv.messages) {
            let li = document.createElement("li");
            li.setAttribute("id", conv.messages[i].id);
            li.setAttribute("class", "convMessage");
            li.innerHTML = '<a href="#" data-userId="'+conv.messages[i].from+'"><' + storage.getUserData("friends")[conv.messages[i].from] + '></a> ' + conv.messages[i].text;
            ul.appendChild(li);
        }
        self.conversationMessages.appendChild(ul);
        self.find("conv_"+conv.id);
    }

    function showConversation(conv) {
        self["body-title"].innerHTML = "<h4>"+conv.name+"</h4>";
        let members = [];
        let friends = storage.getUserFriends();
        for (let i in conv.members) {
            if(conv.members[i] != storage.getUserData("id")) {
                members.push('<a href="#" data-userId="' + conv.members[i] + '">' + friends[conv.members[i]].email + "</a>");
            } else {
                members.push('<a href="#">You</a>');
            }
        }
        self["body-text"].innerHTML = "Members: " + members.join(", ");
        let convs = self.conversationMessages.children;
        for(var i = 0; i < convs.length; i++) {
            self[convs[i].id].hide();
        }
        updateConversationMessages(conv);
        self["conv_"+conv.id].show();

    }

    function updateConversationMessages(conv) {
        let messageList = self["conv_"+conv.id];
        messageList.clear();
        for(var i in conv.messages) {
            let li = document.createElement("li");
            li.setAttribute("id", conv.messages[i].id);
            li.setAttribute("class", "convMessage");
            li.innerHTML = '<a href="#" data-userId="'+conv.messages[i].from+'"><' + storage.getUserData("friends")[conv.messages[i].from] + '></a> ' + conv.messages[i].text;
            messageList.appendChild(li);
        }
    }

    function toggleFriendConvList() {
        self.friends.classList.toggle("min");
        self.friends.classList.toggle("full");
        self.friendList.toggle();
        self.addFriendsLink.toggle();
        self.conversations.classList.toggle("min");
        self.conversations.classList.toggle("full");
        self.conversationList.toggle();
        self.newConvButton.toggle();

    }

    return self;

    function clearBody() {
        self["body-title"].innerHTML = "<h4> Please Login to TW1LL-MSG </h4>";
        self["body-text"].innerHTML = '';
    }
    function logout() {
        self.userInfoLink.innerText = "Login / Register";
        self.conversationList.innerHTML = '';
        self.conversationMessages.innerHTML = '';
        self.friendList.innerHTML = '';
        self.clearBody();
        self.sidepane.hide();
        self.userInfoDropdown.hide();
        self.modal.switch("loginModal");
    }
}
