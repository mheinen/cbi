
// Configuration of Intent Handler
// Declare handlers for processing the incoming intents
var apiConnection = require('./apiConnection');
var cardTitle = '';
var cardContent = '';

var STATES = {
    ANALYSIS: "_TRIVIAMODE", // Asking trivia questions.
    START: "_STARTMODE", // Entry point, start the game.
    HELP: "_HELPMODE" // The user is asking for help.
};



var newSessionHandlers = {

    "LaunchRequest": function () {
        this.handler.state = STATES.START;
        this.emitWithState("StartGame", true);
    },
    "AMAZON.StartOverIntent": function() {
        this.handler.state = STATES.START;
        this.emitWithState("StartGame", true);
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

var handlers = {

    'Greeting': function () {
        console.log("Event: " + JSON.stringify(this.event));
        console.log("Slots: " + JSON.stringify(this.event.request.intent.slots));
        var name1 = this.event.request.intent.slots.vorname_one.value;
        var name2 = this.event.request.intent.slots.vorname_two.value;
        var handle = this;
        var payload = { intent: 'Greeting', name1: name1, name2: name2 };
        apiConnection.doRequest(payload, function(result) {
                console.log('Back in Handler');
                console.log(result);
                handle.emit(':tell', 'Hallo ' + result.nameEins +' und ' + result.nameZwei + '!');
            });
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
    }
};

exports.handlers = handlers;
exports.newSessionHandlers = newSessionHandlers;