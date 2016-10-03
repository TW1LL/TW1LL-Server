"use strict";

function Dom() {
    var self = this;
    self.find = find;
    self.batchFind = batchFind;

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
        if (document.getElementById(id) === null) {
            return false;
        }
        self[id] = document.getElementById(id);
        self[id].tmp = {};
        self[id].on = function (event, fn) {
            self[id].addEventListener(event, fn);
        }
        self[id].hide = function() {
            self[id].tmp.display = self[id].style.display;
            self[id].style.display = "none";
        }
        self[id].show = function() {
            self[id].style.display = self[id].tmp.display || "initial";
        }
        self[id].toggle = function() {
            if (self[id].style.display == "none") {
                self[id].show();
            } else {
                self[id].hide();
            }
        }
        return self[id];
    }


    return self;
}
