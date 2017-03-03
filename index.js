/**
 * Created by matthias on 01.03.17.
 */
// Use Express
var express = require('express');

// Let the Server decide about the port with 8080 as default
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



// Configuration of Intent Handler
// Declare handlers for processing the incoming intents
var apiConnection = require('./apiConnection');
var cardTitle = '';
var cardContent = '';

var STATES = {
    ANALYSIS: "_ANALYSISMODE", // Analyze data.
    START: "_STARTMODE", // Entry point.
    HELP: "_HELPMODE" // The user is asking for help.
};


// Basic Intents to start a new conversation
var newSessionHandlers = {

    "LaunchRequest": function () {
        this.handler.state = STATES.START;
        this.emitWithState("StartAnalysis", true);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = STATES.START;
        this.emitWithState("StartAnalysis", true);
    },
    "AMAZON.HelpIntent": function() {
        this.handler.state = STATES.HELP;
        this.emitWithState("helpTheUser", true);
    },
    "Unhandled": function () {
        var speechOutput = 'Ich habe dich leider nicht verstanden!';
        this.emit(":ask", speechOutput, speechOutput);
    }
};

var startStateHandlers = Alexa.CreateStateHandler(STATES.START, {
    "StartAnalysis": function (newAnalysis) {
        var speechOutput = newAnalysis ? "Willkommen bei Webcomputing. Wir helfen dir bei der Analyse deiner Daten!" : "";

        // Test persisted Skill attributes
        Object.assign(this.attributes, {
            "speechOutput": speechOutput,
        });

        // Set the current state to trivia mode. The skill will now use handlers defined in triviaStateHandlers
        this.handler.state = STATES.ANALYSIS;
        this.emit(":askWithCard", speechOutput, speechOutput, "Webcomputing", speechOutput);
    }
});

var analysisStateHandlers = Alexa.CreateStateHandler(STATES.ANALYSIS, {
    'Greeting': function () {
        console.log("Event: " + JSON.stringify(this.event));
        console.log("Slots: " + JSON.stringify(this.event.request.intent.slots));
        var name1 = this.event.request.intent.slots.vorname_one.value;
        console.log(name1);
        if(name1 != null) this.emit(':tell', 'Hallo ' + name1 +'!');
        else this.emit(':tell', "Ghostbusters!");

    },
    'Select': function () {
        console.log("Event: " + JSON.stringify(this.event));
        console.log("Slots: " + JSON.stringify(this.event.request.intent.slots));
        var tablename = this.event.request.intent.slots.tablename.value;
        var handle = this;
        var payload = { intent: 'Select', tablename: tablename };
        apiConnection.doRequest(payload, function(result) {
            cardTitle = 'Anzeige aller ' + tablename;
            cardContent = 'Ich habe ' + result.counter + ' ' + tablename + ' gefunden!';
            handle.emit(':tellWithCard', 'Ich habe ' + result.counter + ' ' + tablename + ' gefunden!', cardTitle, cardContent);
        });
    },
    "AnswerIntent": function () {
        handleUserGuess.call(this, false);
    },
    "DontKnowIntent": function () {
        handleUserGuess.call(this, true);
    },
    "AMAZON.StartOverIntent": function () {
        this.handler.state = STATES.START;
        this.emitWithState("StartGame", false);
    },
    "AMAZON.RepeatIntent": function () {
        this.emit(":ask", this.attributes["speechOutput"], this.attributes["speechOutput"]);
    },
    "AMAZON.HelpIntent": function () {
        this.handler.state = STATES.HELP;
        this.emitWithState("helpTheUser", false);
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
    }
});

var helpStateHandlers = Alexa.CreateStateHandler(STATES.HELP, {
    "helpTheUser": function (newAnalysis) {
        var askMessage = newAnalysis ? "Möchten Sie beginnen?" : "Zum wiederholen der letzten Frage, sage Wiederholen" + "Möchten Sie weitermachen?";
        var speechOutput = "Ich biete ihnen die Möglichkeit per Spracheingabe Ihre Daten zu analysieren" + askMessage;
        var repromptText = "Sage einfach etwas wie" + "zeige mir alle Kunden mit Umsatz größer 1000" + askMessage;
        this.emit(":ask", speechOutput, repromptText);
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
    alexa.registerHandlers(newSessionHandlers, startStateHandlers, analysisStateHandlers, helpStateHandlers);
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