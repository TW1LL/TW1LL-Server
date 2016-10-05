"use strict";

function Dom() {
    var self = this;
    self.find = find;
    self.batchFind = batchFind;
    self.modal = new modal(self);
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
            }
        };
        return mdl;
    }

    return self;
}
