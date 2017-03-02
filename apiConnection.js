/**
 * Created by matthias on 02.03.17.
 */
// To make http requests
var request = require('request');

//API URL
var API_URL = 'https://cbiapi.herokuapp.com';
//var API_URL = 'http://localhost:3000';
exports.doGreetRequest = function(body, callback) {

    request.post(API_URL, {json: body}, function (error, response, body) {
        if (!error && response.statusCode == 200) {
           // console.log(response);
            console.log('Returned from API: '+JSON.stringify(body));
            return callback(body);
        }
    });
};

