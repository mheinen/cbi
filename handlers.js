// Configuration of Intent Handler
// Declare handlers for processing the incoming intents
var apiConnection = require('./apiConnection');
var handlers = {

    'Greeting': function () {
        console.log("Event: " + JSON.stringify(this.event));
        console.log("Slots: " + JSON.stringify(this.event.request.intent.slots));
        var name1 = this.event.request.intent.slots.vorname_one.value;
        var name2 = this.event.request.intent.slots.vorname_two.value;

        var payload = {name1: name1, name2: name2};
        var response = apiConnection.doRequest(payload);
        this.emit(':tell', 'Hallo ' + response.nameEins +' und ' + response.nameZwei + '!');
    }
};

exports.handlers = handlers;