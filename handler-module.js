/**
 * Created by Turnus on 07.03.2017.
 */
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
    AGGREGATION: "_AGGREGATIONMODE",
    ANALYSIS: "_ANALYSISMODE", // Analyze data.
    START: "_STARTMODE", // Entry point.
    HELP: "_HELPMODE" // The user is asking for help.
};

exports.buildHandlers = function(Alexa) {
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
            console.log(this.event);
            Object.assign(this.attributes, {
                "intent": "Select",
                "table": this.event.request.intent.slots.table.value,
                "column": this.event.request.intent.slots.column.value,
                "operand": this.event.request.intent.slots.operand.value,
                "value": this.event.request.intent.slots.value.value,
                "accessToken": this.event.accessToken
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
        "AMAZON.YesIntent": function() {
            this.handler.state = STATES.GROUPING;
            this.emitWithState("chooseGrouping");
        },
        "AMAZON.NoIntent": function() {
            this.handler.state = STATES.GRAPH;
            this.emitWithState("withGraph");
        }
    });
    var groupingStateHandlers = Alexa.CreateStateHandler(STATES.GROUPING, {
        "chooseGrouping": function () {
            this.attributes["intent"] = "Group";
            var speechOutput = this.t('GROUPING');
            this.emit(":ask", speechOutput, speechOutput);
        },
        'Group': function () {
            Object.assign(this.attributes, {
                "kind": "group",
                "groupColumn": this.event.request.intent.slots.column.value
            });
            this.handler.state = STATES.AGGREGATION;
            this.emitWithState("chooseColumn");
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
    });var aggregationStateHandlers = Alexa.CreateStateHandler(STATES.AGGREGATION, {
        "chooseColumn": function () {
            var speechOutput = this.t('CHOOSE_COLUMN');
            var repeat = this.t('CHOOSE_COLUMN_REPEAT');
            this.emit(":ask", speechOutput, repeat);
        },
        "Aggregation": function () {
            Object.assign(this.attributes, {
                "aggFunction": this.event.request.intent.slots.aggFunction.value,
                "aggColumn": this.event.request.intent.slots.aggColumn.value
            });
            this.handler.state = STATES.GRAPH;
            this.emitWithState("withGraph");
        },
        "AMAZON.HelpIntent": function () {
            this.handler.state = STATES.HELP;
            this.emitWithState("helpAggregation");
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
        "withGraph": function () {
            var speechOutput = this.t('WITH_GRAPH');
            this.emit(":ask", speechOutput, speechOutput);
        },
        "AMAZON.YesIntent": function() {
            this.attributes["withGraph"] = true;
            this.handler.state = STATES.DONE;
            this.emitWithState("done");
        },
        "AMAZON.NoIntent": function() {
            this.attributes["withGraph"] = false;
            this.handler.state = STATES.DONE;
            this.emitWithState("done");
        },
        "Unhandled": function () {
            var speechOutput = this.t('DID_NOT_UNDERSTAND');
            this.emit(":ask", speechOutput , speechOutput);
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
        "helpAggregation": function () {
            var speechOutput = this.t('HELP_AGGREGATION');
            this.handler.state = STATES.AGGREGATION;
            this.emit(":ask", speechOutput, speechOutput);
        },
        "Unhandled": function () {
            var speechOutput = this.t('DID_NOT_UNDERSTAND');
            this.emit(":ask", speechOutput , speechOutput);
        }
    });
    var handlerArray = [aggregationStateHandlers, groupingStateHandlers, selectStateHandlers, startStateHandlers,
                        newSessionHandlers, helpStateHandlers, doneStateHandlers, graphStateHandlers,
                        abortStateHandlers];
    return handlerArray;
};


function apiCall(handler) {
    var payload = { intent: handler.attributes["intent"], table: handler.attributes["table"],
        column: handler.attributes["column"], operand: handler.attributes["operand"],
        value: handler.attributes["value"], groupColumn: handler.attributes["groupColumn"],
        kind: handler.attributes["kind"], withGraph: handler.attributes["withGraph"],
        function: handler.attributes["aggFunction"], aggColumn: handler.attributes["aggColumn"],
        accessToken: handler.attributes["accessToken"]};

    apiConnection.doRequest(payload, function(result) {
        var speechOutput = result.speechOutput;
        var count = result.selectCount;
        cardTitle = 'Anzeige aller ' + handler.attributes["table"];
        cardContent = 'Ich habe ' + count + ' gefunden!';
        handler.emit(':askWithCard', speechOutput , cardTitle, cardContent);
        //handler.emit(':askWithCard', "Ich habe " + count + ' ' + handler.attributes["table"] + ' gefunden!' + 'Wollen Sie eine weitere Analyse durchführen?', cardTitle, cardContent);
    });
}