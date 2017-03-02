/**
 * Created by matthias on 02.03.17.
 */
// To make http requests
var request = require('request');

//API URL
var API_URL = 'https://cbiapi.herokuapp.com';

exports.doRequest = function(body) {
    console.log(body);
    request.post(API_URL, {json: {name1: body.name1, name2: body.name2 }}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            return body;
        }
    });


    /*    var request = new http.ClientRequest({
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
     request.end(body)*/
};

