"use strict";

function Dom() {
    var self = this;
    self.find = find;
    self.batchFind = batchFind;
    self.modal = new modal(self);
    self.addUser = addUser;
    self.createConversation =  createConversation;
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

        function toggle() {
            if (self[id].style.display == "none") {
                    self[id].show();
            } else {
                self[id].hide();
            }
        }
        function hide() {
            self[id].tmp.display = self[id].style.display;
            self[id].style.display = "none";
        }
        function show() {
            self[id].style.display = self[id].tmp.display || "initial";
        }
        function on(event, fn) {
            self[id].addEventListener(event, fn);
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


    function createConversation(conv) {
        let li = document.createElement("li");
        li.setAttribute("id", conv.id);
        li.setAttribute("class", "convLink");
        li.innerHTML = '<a href="#">' + conv.name + '</a>';
        self.conversationList.appendChild(li);

        let ul = document.createElement("ul");
        ul.setAttribute("id", "conv_"+conv.id);
        for(var i in conv.messages) {
            li = document.createElement("li");
            li.setAttribute("id", conv.messages[i].id);
            li.setAttribute("class", "convMessage");
            li.innerHTML = '<a href="#" data-userId="'+conv.messages[i].from+'"><' + getUserData("friends")[conv.messages[i].from] + '></a> ' + conv.messages[i].text;
            ul.appendChild(li);
        }
    }
    return self;
}
