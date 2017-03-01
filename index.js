/**
 * Created by matthias on 01.03.17.
 */
var express = require('express');
var port = process.env.PORT || 8080;

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
    alexa.registerHandlers(handlers);
    alexa.execute();
});

// Declare handlers for processing the incoming intents
var handlers = {
    'Greeting': function () {
        console.log("Event: " + JSON.stringify(this.event));
        console.log("Slots: " + JSON.stringify(this.event.request.intent.slots));
        var name1 = this.event.request.intent.slots.vorname1.value;
        var name2 = this.event.request.intent.slots.vorname2.value;
        this.emit(':tell', 'Hallo ' + name1 +' und ' + name2 + '!');
    }
};

// body holds one of the supported values for the used channel (i.e. ON or OFF) //so dann beispielhaft die rails api aufrufe
var doRequest = function (body) {
    var request = new http.ClientRequest({
        hostname: "127.0.0.1",
        port: 8080,
        // Path to the channel for the device we like to control (see REST documentation)
        path: "/rest/items/minecraft_minecraft_switch_192_168_0_17__9998_88ad955d_ce14_4c78_bb2c_942a64a9da7c_channelPowered",
        method: "POST",
        headers: {
            "Content-Type": "text/plain",
            "Content-Length": Buffer.byteLength(body)
        }
    });
    request.end(body)
};

app.listen(port, function () {
    console.log('Warte auf Anfragen auf port ' + port +'!');
});
