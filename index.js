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
var handlerModule = require('./handler-module');
var languageString = require("./language").language;

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
var handlerArray = handlerModule.buildHandlers(Alexa);


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
    console.log(handlerArray);
    console.log(JSON.stringify(handlerArray));
    alexa.registerHandlers(handlerArray);
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
