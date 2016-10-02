"use strict";

class Log {

    constructor(logLevel) {
        logLevel = logLevel.toLowerCase();
        this.levels = {
            // generic
            "high": 10,
            "med-high": 7,
            "medium": 5,
            "medium-low": 3,
            "low": 1,
            "off": 0,
            // events threshold
            "events": 5,
            "errors": 3,
            "recurrent": 7
        };
        this.logLevel = this.levels[logLevel];

    }

    set level(logLevel) {
        if (typeof logLevel === "number") {
            this.logLevel = logLevel;
        } else if(typeof logLevel === "string") {
            this.logLevel = this.levels[logLevel];
        }
    }
    event(message) {
        if (this.logLevel >= this.levels["events"]) {
            console.log("EVT >> ", message);
        }
    }
    recurrent(message) {
        if (this.logLevel >= this.levels["recurrent"]) {
            console.log("EVT >>", message);
        }
    }
    error(message) {
        if (this.logLevel >= this.levels["errors"]) {
            console.log("ERR >>", message);
        }
    }
}

module.exports = Log;