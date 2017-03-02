// Configuration of Intent Handler
// Declare handlers for processing the incoming intents
var apiConnection = require('./apiConnection');
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
            console.log('Back in Handler');
            console.log(result);
            handle.emit(':tell', 'Ich habe ' + result.counter + ' ' + tablename + ' gefunden!');
        });
    }
};

exports.handlers = handlers;