/**
 * Created by matthias on 01.03.17.
 */
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
    DONE: "_DONEMODE",
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
        this.emit(":ask", this.t('DIN_NOT_UNDERSTAND'), this.t('DIN_NOT_UNDERSTAND'));
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
        console.log('Select');
        Object.assign(this.attributes, {
            "table": this.event.request.intent.slots.table.value,
            "column": this.event.request.intent.slots.column.value,
            "operand": this.event.request.intent.slots.operand.value,
            "value": this.event.request.intent.slots.value.value
        });
        console.log('Assigned');
        this.emit(':ask', this.t('START_GROUPING'), this.t('START_GROUPING_REPEAT'));
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = STATES.HELP;
        this.emitWithState("helpSelect");
    },
    "AMAZON.StopIntent": function () {
        this.handler.state = STATES.HELP;
        var speechOutput = "Analyse beenden?";
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", "Auf wiedersehen!");
    },
    "Unhandled": function () {
        var speechOutput = "Ich habe dich leider nicht verstanden";
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in analysis state: " + this.event.request.reason);
    },
    "AMAZON.YesIntent": function() {
        this.handler.state = STATES.GROUPING;
        this.emitWithState("ChooseGrouping");
    },
    "AMAZON.NoIntent": function() {
        var handle = this;
        var payload = { intent: 'Select', tablename: this.attributes["table"], column: this.attributes["column"],
            operand: this.attributes["operand"], value: this.attributes["value"] };

        apiConnection.doRequest(payload, function(result) {
            var number = result.counter == "1" ? "einen" : result.counter;
            console.log("Number: " + number);
            cardTitle = 'Anzeige aller ' + handle.attributes["table"];
            cardContent = 'Ich habe ' + number + ' gefunden!';
            handle.handler.state = STATES.DONE;
            handle.emit(':askWithCard', "Ich habe " + number + ' ' + handle.attributes["table"] + ' gefunden!' + 'Haben Sie noch weitere Fragen?', cardTitle, cardContent);
        });
    }
});
var doneStateHandlers = Alexa.CreateStateHandler(STATES.DONE, {

    "AMAZON.YesIntent": function() {
        this.handler.state = STATES.SELECT;
        var speechOutput = "Wählen Sie die Daten bitte aus.";
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = "Dann bis zum nächsten mal.";
        this.emit(":tell", speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", "Ok, dann bis später!");
    }
});

var helpStateHandlers = Alexa.CreateStateHandler(STATES.HELP, {
    "helpSelect": function () {
        var speechOutput = this.t('HELP_SELECT');
        this.handler.state = STATES.SELECT;
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        var newAnalysis = (this.attributes["speechOutput"] && this.attributes["speechOutput"]) ? false : true;
        this.emitWithState("helpTheUser", newAnalysis);
    },
    "AMAZON.HelpIntent": function() {
        var newAnalysis = (this.attributes["speechOutput"] && this.attributes["speechOutput"]) ? false : true;
        this.emitWithState("helpTheUser", newAnalysis);
    },
    "AMAZON.YesIntent": function() {
        if (this.attributes["speechOutput"] && this.attributes["speechOutput"]) {
            this.handler.state = STATES.ANALYSIS;
            this.emitWithState("AMAZON.RepeatIntent");
        } else {
            this.handler.state = STATES.START;
            this.emitWithState("StartGame", false);
        }
    },
    "AMAZON.NoIntent": function() {
        var speechOutput = "Dann setzen wir die Analyse später fort.";
        this.emit(":tell", speechOutput);
    },
    "AMAZON.StopIntent": function () {
        var speechOutput = "Möchten Sie weitermachen?";
        this.emit(":ask", speechOutput, speechOutput);
    },
    "AMAZON.CancelIntent": function () {
        this.emit(":tell", "Ok, dann bis später!");
    },
    "Unhandled": function () {
        var speechOutput = "Sage ja, um fortzufahren. Sage nein, um zu beenden.";
        this.emit(":ask", speechOutput, speechOutput);
    },
    "SessionEndedRequest": function () {
        console.log("Session ended in help state: " + this.event.request.reason);
    }
});

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
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, selectStateHandlers, helpStateHandlers, doneStateHandlers);
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
