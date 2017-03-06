/**
 * Created by matthias on 01.03.17.
 */
"use strict";
// Use Express
var express = require('express');

// Let the Server decide about the port with 8000 as default
var port = process.env.PORT || 8080;

// Parse JSON Bodys
var bodyParser = require('body-parser');

var app = express();

// Initialize the Alexa SDK
var Alexa = require('alexa-sdk');
// Amazon erwartet Verifizierung
var verifier = require('alexa-verifier-middleware');


// create a router and attach to express before doing anything else
var alexaRouter = express.Router();
app.use('/alexa', alexaRouter);

// attach the verifier middleware first because it needs the entire
// request body, and express doesn't expose this on the request object
alexaRouter.use(verifier);

alexaRouter.use(bodyParser.json());

// Import language resource
var languageString = require("./language").language;

// Configuration of Intent Handler
// Declare handlers for processing the incoming intents
var apiConnection = require('./apiConnection');
var cardTitle = '';
var cardContent = '';

var STATES = {
    SELECT: "_SELECTMODE",
    ABORT: "_ABORTMODE",
    DONE: "_DONEMODE",
    GRAPH: "_GRAPHMODE",
    GROUPING: "_GROUPINGMODE",
    ANALYSIS: "_ANALYSISMODE", // Analyze data.
    START: "_STARTMODE", // Entry point.
    HELP: "_HELPMODE" // The user is asking for help.
};


// Basic Intents to start a new conversation
var newSessionHandlers = {

    "LaunchRequest": function () {
        this.handler.state = STATES.START;
        this.emitWithState("StartSelection", true);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = STATES.START;
        this.emitWithState("StartSelection", false);
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = STATES.HELP;
        this.emitWithState("helpTheUser", true);
    },
    "Unhandled": function () {
        var speechOutput = this.t('DID_NOT_UNDERSTAND');
        this.emit(":ask", speechOutput , speechOutput);
    }
};

var startStateHandlers = Alexa.CreateStateHandler(STATES.START, {
    "StartSelection": function (newAnalysis) {
        var speechOutput = newAnalysis ? this.t('WELCOME_MESSAGE') : "";

        // Set the current state to trivia mode. The skill will now use handlers defined in triviaStateHandlers
        this.handler.state = STATES.SELECT;
        this.emit(":ask", speechOutput, speechOutput);
    }
});

var selectStateHandlers = Alexa.CreateStateHandler(STATES.SELECT, {
    'Select': function () {
        Object.assign(this.attributes, {
            "intent": "Select",
            "table": this.event.request.intent.slots.table.value,
            "column": this.event.request.intent.slots.column.value,
            "operand": this.event.request.intent.slots.operand.value,
            "value": this.event.request.intent.slots.value.value
        });
        this.emit(':ask', this.t('START_GROUPING'), this.t('START_GROUPING_REPEAT'));
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = STATES.HELP;
        this.emitWithState("helpSelect");
    },
    "AMAZON.StopIntent": function () {
        this.handler.state = STATES.ABORT;
        var speechOutput = this.t('END_QUESTION');
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.handler.state = STATES.ABORT;
        var speechOutput = this.t('END_QUESTION');
        this.emit(":ask", speechOutput, speechOutput);
    },
    "Unhandled": function () {
        var speechOutput = this.t('DID_NOT_UNDERSTAND');
        this.emit(":ask", speechOutput , speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in analysis state: " + this.event.request.reason);
    },
    "AMAZON.YesIntent": function() {
        this.handler.state = STATES.GROUPING;
        this.emitWithState("chooseGrouping");
    },
    "AMAZON.NoIntent": function() {
        this.handler.state = STATES.GRAPH;
        this.emitWithState("fromSelect");
/*        var handle = this;
        var payload = { intent: 'Select', tablename: this.attributes["table"], column: this.attributes["column"],
            operand: this.attributes["operand"], value: this.attributes["value"] };

        apiConnection.doRequest(payload, function(result) {
            var number = result.counter == "1" ? "einen" : result.counter;
            console.log("Number: " + number);
            cardTitle = 'Anzeige aller ' + handle.attributes["table"];
            cardContent = 'Ich habe ' + number + ' gefunden!';
            handle.handler.state = STATES.DONE;
            handle.emit(':askWithCard', "Ich habe " + number + ' ' + handle.attributes["table"] + ' gefunden!' + 'Haben Sie noch weitere Fragen?', cardTitle, cardContent);
        });*/
    }
});
var groupingStateHandlers = Alexa.CreateStateHandler(STATES.GROUPING, {
    "chooseGrouping": function () {
        var speechOutput = this.t('GROUPING');
        this.emit(":ask", speechOutput, speechOutput);
    },
    'Group': function () {
        Object.assign(this.attributes, {
            "kind": "group",
            "groupColumn": this.event.request.intent.slots.column.value
        });
        this.emit(':ask', this.t('WITH_GRAPH'), this.t('WITH_GRAPH'));
    },
    'Cluster': function () {
        Object.assign(this.attributes, {
            "kind": "cluster"
        });
        this.emit(':ask', this.t('WITH_GRAPH'), this.t('WITH_GRAPH'));
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = STATES.HELP;
        this.emitWithState("helpGrouping");
    },
    "AMAZON.YesIntent": function() {
        var handle = this;
        var payload = { intent: 'GroupWithGraph', tablename: this.attributes["table"], column: this.attributes["column"],
            operand: this.attributes["operand"], value: this.attributes["value"],
            groupColumn: this.attributes["groupColumn"], kind: this.attributes["kind"] };

        apiConnection.doRequest(payload, function(result) {
            var number = result.counter == "1" ? "einen" : result.counter;
            console.log("Number: " + number);
            cardTitle = 'Anzeige aller ' + handle.attributes["table"];
            cardContent = 'Ich habe ' + number + ' gefunden!';
            handle.handler.state = STATES.DONE;
            handle.emit(':askWithCard', "Ich habe " + number + ' ' + handle.attributes["table"] + ' gefunden!' + 'Haben Sie noch weitere Fragen?', cardTitle, cardContent);
        });
    },
    "AMAZON.NoIntent": function() {
        var handle = this;
        var payload = { intent: 'Group', tablename: this.attributes["table"], column: this.attributes["column"],
            operand: this.attributes["operand"], value: this.attributes["value"],
            groupColumn: this.attributes["groupColumn"], kind: this.attributes["kind"] };

        apiConnection.doRequest(payload, function(result) {
            var number = result.counter == "1" ? "einen" : result.counter;
            console.log("Number: " + number);
            cardTitle = 'Anzeige aller ' + handle.attributes["table"];
            cardContent = 'Ich habe ' + number + ' gefunden!';
            handle.handler.state = STATES.DONE;
            handle.emit(':askWithCard', "Ich habe " + number + ' ' + handle.attributes["table"] + ' gefunden!' + 'Haben Sie noch weitere Fragen?', cardTitle, cardContent);
        });
    },
    "AMAZON.StopIntent": function () {
        this.handler.state = STATES.ABORT;
        var speechOutput = this.t('END_QUESTION');
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.handler.state = STATES.ABORT;
        var speechOutput = this.t('END_QUESTION');
        this.emit(":ask", speechOutput, speechOutput);
    },
    "Unhandled": function () {
        var speechOutput = this.t('DID_NOT_UNDERSTAND');
        this.emit(":ask", speechOutput , speechOutput);
    }
});
var abortStateHandlers = Alexa.CreateStateHandler(STATES.ABORT, {

    "AMAZON.YesIntent": function() {
        var speechOutput = this.t('END_SESSION');
        this.emit(":tell", speechOutput);
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = this.t('ANOTHER_SELECT');
        this.handler.state = STATES.SELECT;
        this.emit(":ask", speechOutput, speechOutput);
    },
    "Unhandled": function () {
        var speechOutput = this.t('DID_NOT_UNDERSTAND');
        this.emit(":ask", speechOutput , speechOutput);
    }
});
var graphStateHandlers = Alexa.CreateStateHandler(STATES.GRAPH, {
    "fromSelect": function () {
        var speechOutput = this.t('WITH_GRAPH');
        this.emit(":ask", speechOutput, speechOutput);
    },
    "helpGrouping": function () {
        var speechOutput = this.t('HELP_GROUPING');
        this.handler.state = STATES.GROUPING;
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.YesIntent": function() {
        this.attributes["intent"] = "selectWithGraph";
        this.handler.state = STATES.DONE;
        this.emitWithState("done");
    },
    "AMAZON.NoIntent": function() {
        this.handler.state = STATES.DONE;
        this.emitWithState("done");
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = STATES.START;
        this.emitWithState("StartGame", false);
    },
    "Unhandled": function () {
        var speechOutput = this.t('DID_NOT_UNDERSTAND');
        this.emit(":ask", speechOutput , speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in help state: " + this.event.request.reason);
    }
});
var doneStateHandlers = Alexa.CreateStateHandler(STATES.DONE, {
    "done": function () {
        apiCall(this);
    },
    "AMAZON.YesIntent": function() {
        this.handler.state = STATES.SELECT;
        var speechOutput = this.t('ANOTHER_SELECT');
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = this.t('END_SESSION');
        this.emit(":tell", speechOutput);
    },
    "Unhandled": function () {
        var speechOutput = this.t('DID_NOT_UNDERSTAND');
        this.emit(":ask", speechOutput , speechOutput);
    }
});
var helpStateHandlers = Alexa.CreateStateHandler(STATES.HELP, {
    "helpSelect": function () {
        var speechOutput = this.t('HELP_SELECT');
        this.handler.state = STATES.SELECT;
        this.emit(":ask", speechOutput, speechOutput);
    },
    "helpGrouping": function () {
        var speechOutput = this.t('HELP_GROUPING');
        this.handler.state = STATES.GROUPING;
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = STATES.START;
        this.emitWithState("StartGame", false);
    },
    "Unhandled": function () {
        var speechOutput = this.t('DID_NOT_UNDERSTAND');
        this.emit(":ask", speechOutput , speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in help state: " + this.event.request.reason);
    }
});

function apiCall(handler) {
    var payload = { intent: handler.attributes["intent"], tablename: handler.attributes["table"],
        column: handler.attributes["column"], operand: handler.attributes["operand"],
        value: handler.attributes["value"], groupColumn: handler.attributes["groupColumn"],
        kind: handler.attributes["kind"] };

    apiConnection.doRequest(payload, function(result) {
        var number = result.counter == "1" ? "einen" : result.counter;
        console.log("Number: " + number);
        cardTitle = 'Anzeige aller ' + handler.attributes["table"];
        cardContent = 'Ich habe ' + number + ' gefunden!';
        handler.emit(':askWithCard', "Ich habe " + number + ' ' + handler.attributes["table"] + ' gefunden!' + 'Haben Sie noch weitere Fragen?', cardTitle, cardContent);
    });
}

alexaRouter.get('/', function (req, res) {
    res.writeHead(200);
    res.end("hello world\n");
});
alexaRouter.post('/', function(req, res) {
    // Build the context manually, because Amazon Lambda is missing and alexa-sdk normally requires it
    var context = {
        succeed: function (result) {
            console.log(result);
            res.json(result);
        },
        fail:function (error) {
            console.log(error);
        }
    };
    // Delegate the request to the Alexa SDK and the declared intent-handlers
    var alexa = Alexa.handler(req.body, context);
    alexa.resources = languageString;
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, selectStateHandlers,
        helpStateHandlers, doneStateHandlers, abortStateHandlers, groupingStateHandlers,
        graphStateHandlers);
    alexa.execute();
});

// ********** Test ************
//var apiConnection = require('./apiConnection');
//var payload = {name1: 'Hans', name2: "Günther"};
// ********** Test Ende ***********
 app.listen(port, function () {
 console.log('Warte auf Anfragen auf port ' + port +'!');
 //  apiConnection.doRequest(payload);

 });
