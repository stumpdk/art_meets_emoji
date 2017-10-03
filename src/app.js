//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
const dotenv = require('dotenv').config();
const schedule = require('node-schedule');
var winston = require('winston');
const db = require('../src/models/db')(winston);
const dbRelated = require('../src/models/dbRelated');
//const text = require('../src/models/textParser');
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<script src=\"https://button.glitch.me/button.js\" data-style=\"glitch\"></script><div class=\"glitchButton\" style=\"position:fixed;top:20px;right:20px;\"></div></body></html>";



const synonyms = require("synonyms");


// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
    if (req.query['hub.mode'] === 'subscribe' &&
        req.query['hub.verify_token'] === (process.env.VERIFY_TOKEN || 'test') /*process.env.VERIFY_TOKEN*/ ) {
        winston.log('info', "Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        winston.log('error', "Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

app.get('/syn', function(req, res) {
    text.test2('this is a test string containing words like yellow, happy, angry and Copenhagen');
    //winston.log('info', synonyms(req.query.query));
    res.send(JSON.stringify(synonyms(req.query.query)));
});
// Display the web page
app.get('/', function(req, res) {
    res.writeHead(200, {
        'Content-Type': 'text/html'
    });
    res.write(messengerButton);
    res.end();
});

// Message processing
app.post('/webhook', function(req, res) {
    var data = req.body;

    winston.log('info', 'got request', data);


    // Make sure this is a page subscription
    if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            var pageID = entry.id;
            var timeOfEvent = entry.time;

                // Iterate over each messaging event
                entry.messaging.forEach(function(event) {
                    if(event.get_started){
                        sendTextMessage(event.sender.id, 'Velkommen!');
                    }
                    if (event.message) {
                        winston.log('info', "received message", event);
                        receivedMessage(event);
                    } else if (event.postback) {
                        //receivedPostback(event);
                        winston.log('info', "received postback", event);
                        handlePostBack(event.postback, event.sender.id, res);
                    } else if (event.read) {
                        winston.log('info', "received read event");
                    } else {
                        winston.log('info', "Webhook received unknown event: ", event);
                    }
                });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        //res.sendStatus(200);
    }
    //All went kind of well, even if we dont support other types of requests than pages
    res.sendStatus(200);
});

function handlePostBack(postback, user_id, res) {
    console.warn('trying to parse:', postback);
    var payload = JSON.parse(postback.payload);

    //Postback actions:
    //subscribe (payload.type*)
    //unsubscribe (payload.type*)
    //unsubscribe_reason (payload.type*, payload.reason*, payload.art_id*)
    //image_reaction (payload.type*,payload.art_id*, payload.reaction*)

    switch(payload.type){
        case 'subscribe':
            subscribe(payload);
        break;
        case 'unsubscribe':
            unsubscribe(payload);
        break;
        case 'unsubscribe_reason':
            unsubscribeReason(payload);
        break;
        case 'image_reaction':
            saveImageResponse(payload);
        break;
        case 'get_started':
            sendTextMessage(user_id, 'Welcome.:)')
        break;
        default:
            winston.log('warn', 'unhandled postback type. This is the payload: ' + payload);
    }


    function subscribe(payload){
        db.subscribeUser(user_id, function(){
            res.sendStatus(200);
        });
    }

    function unsubscribe(payload){
        winston.log('info', 'unsubscribe for user ' + user_id);
        var reason = null;
        db.unsubscribeUser(user_id, reason, function sendStatus() {
            sendUnsubscribeReasonButton();
        });
    }

    function unsubscribeReason(payload){
        var reason =  payload.reason;
        db.unsubscribeUser(user_id, reason, function sendStatus() {
            sendTextMessage(payload.user_id, 'Okay. Got it. Hopefully we\'ll see you again. :)');
        });
    }

    function saveImageResponse(payload){
        db.saveResponse(payload.art_id, user_id, payload.reaction, respondOnPostback);

        function respondOnPostback() {
            if (payload.reaction == 0) {
                sendTextMessage(payload.user_id, 'Got that. You won\'t get art like that again.');
            } else {
                sendTextMessage(payload.user_id, 'Got that. Glad you liked it! :)');
            }
        }
    }
}

app.post('/subscribe', function(req, res) {
    winston.log('info', db);
    winston.log('info', 'subscribe endpoint reached');

    var data = req.body;
    //if(data.object === 'page'){
    if (req.body['messenger user id']) {
        winston.log('info', data.entry);
        db.subscribeUser(req.body['messenger user id'])
    } else {
        winston.log('info', 'message user id not set!');
    }
    //    }
    //    else{
    //Didn't receive the right format
    //        winston.log('info', 'subscribe data wasn\'t a page');
    //    }

    res.sendStatus(200);
});

app.post('/unsubscribe', function(req, res) {
    winston.log('info', 'unsubscribe endpoint reached');

    var data = req.body;
    //if(data.object === 'page'){
    if (req.body['messenger user id']) {
        var reason = req.query.reason || false;
        winston.log('info', data.entry);
        db.unsubscribeUser(req.body['messenger user id'], reason, function sendStatus() {
            res.sendStatus(200);
        });
    }
    //    }
    //    else{
    //Didn't receive the right format
    //    winston.log('info', 'unsubscribe data wasn\'t a page');
    //    }



});

// Incoming events handling
function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    winston.log('info', "Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
    //    winston.log('info', JSON.stringify(message));

    var messageId = message.mid;
    winston.log('info', message.message);
    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
        // If we receive a text message, check to see if it matches a keyword
        // and send back the template example. Otherwise, just echo the text we received.
        switch (messageText.toLowerCase()) {
            //Return a random image
            case 'image':
                winston.log('info', 'search for image ' + messageText);
                getAssetsByText(senderID);
                break;

                //Reponse on unsubscription
            case 'it\'s too often.':
            case 'paintings are ugly':
            case 'i was just curious':
                winston.log('info', 'Got subscription feedback.');
                break;

                //Search art by keyword or get tags from sentence
            default:
                //If question get image by description, artist or tag
                if (messageText.indexOf('?') !== -1) {
                    var n = messageText.split(" ");
                    winston.log('info', 'Searching for', n);
                    getAssetsByText(senderID, n[n.length - 1].replace('?', ''));
                } else {
                    //Save tags for image
                    var n = messageText.split(" ");
                    winston.log('info', 'Saving', n);
                    db.saveTags(senderID, n, sendThankYouMessage);
                }

                break;
        }
    } else if (messageAttachments) {
        //        sendTextMessage(senderID, "Message with attachment received");
    }

    function sendThankYouMessage() {
        sendTextMessage(senderID, 'Thank you for your input, I can probaply use it for the image!');
    }
}

function getAssetsByText(recipientId, text) {
    if (text == undefined) {
        text = "";
        db.getImage(recipientId, sendResultAsImageOrSearchByText);
        return;
    }

    dbRelated.searchFavoritesRelatedImagesByText(recipientId, text, sendResultAsImageOrSearchByText);


    function sendResultAsImageOrSearchByText(result) {

        if (!result) {
            console.log('!result');
            winston.log('info', 'no result when searching for related images. Trying to search by text: ' + text);
            db.searchImagesByText(recipientId, text, sendImageOrNoResultsText);
            return;
        }
        console.log('here is the result: ', result.id, result.title);

        sendImageOrNoResultsText(result);
    }

    function sendImageOrNoResultsText(result) {
        console.log('sendImageOrNoResultsText');
        if (result) {
            winston.log('info', 'heres the result', result.id, result.title);
            sendImageMessage(recipientId, result);
        } else {
            winston.log('info', "could not find anyting, sending sorry message");
            sendTextMessage(recipientId, "Sorry, I couldn't find anything for you. Want a random painting? Write \"image\". Looking for something particular? Write a name, year, or title and an \"?\" Then we'll go through our collection to see if we have something for you!");
        }
    }
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
    winston.log('info', 'sending text' + messageText);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: messageText
        }
    };

    callSendAPI(messageData);
}

function sendImageMessage(recipientId, image_data) {
    winston.log('info', 'sending image');
    db.insertSeenArt(recipientId, image_data.id);
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "image",
                payload: {
                    url: image_data.image_url
                }
            }
        }
    };

    callSendAPI(messageData, sendButtons);

    function sendButtons() {
        sendRespondButtons(recipientId, image_data.title, image_data.id);
    };
}

function sendRespondButtons(recipientId, image_title, art_id) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: image_title,
                        subtitle: 'Do you like it?',
                        //image_url: image_data.image_url,
                        //item_url: image_data.image_url,
                        buttons: [{
                            type: "postback",
                            title: "Nice! 😍",
                            payload: JSON.stringify({
                                type: 'reaction',
                                art_id: art_id,
                                reaction: 1,
                                user_id: recipientId
                            }),
                        }, {
                            type: "postback",
                            title: "Nah... 😒",
                            payload: JSON.stringify({
                                type: 'reaction',
                                art_id: art_id,
                                reaction: 0,
                                user_id: recipientId
                            }),
                        }],
                    }],
                }
            }
        }
    };
    callSendAPI(messageData);
}

function sendUnsubscribeReasonButton(recipientId, art_id) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            attachment: {
                type: "template",
                payload: {
                    template_type: "generic",
                    elements: [{
                        title: 'You will not receive any more pictures from us. \n We could really use a bit of feedback, so please let us know why you don\'t want daily pictures anymore:',
                        buttons: [{
                            type: "postback",
                            title: "It's too often",
                            payload: JSON.stringify({
                                type: 'unsubscribe_reason',
                                art_id: art_id,
                                reaction: 'too_often',
                                user_id: recipientId
                            }),
                        }, {
                            type: "postback",
                            title: "Paintings are ugly",
                            payload: JSON.stringify({
                                type: 'unsubscribe_reason',
                                art_id: art_id,
                                reaction: 'painting_are_ugly',
                                user_id: recipientId
                            }),
                        }, {
                            type: "postback",
                            title: "I was just curious",
                            payload: JSON.stringify({
                                type: 'unsubscribe_reason',
                                art_id: art_id,
                                reaction: 'just_curious',
                                user_id: recipientId
                            })
                        }],
                    }],
                }
            }
        }
    };
    callSendAPI(messageData);
}

function callSendAPI(messageData, cb) {
    if (process.env.mode && process.env.mode.toLowerCase() == 'dev') {
        winston.log('info', 'if not in dev mode, this would be sent: ', messageData);
        winston.log('info', 'with this token' + process.env.ACCESS_TOKEN);
        if (cb) {
            cb();
        }
        return;
    }

    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: process.env.ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData,
    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            winston.log('info', "Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            winston.log('error', "Unable to send message.", response);
            //            winston.log('error', response);
            //            winston.log('error', error);
        }

        if (cb) {
            cb();
        }
    });
}

//Send images to recipients every 24 hours (or so)
/*var j = schedule.scheduleJob('* * * * *', function(){
  winston.log('info', 'Sending messages for recipients now!');
});*/

if (process.env.MODE && process.env.MODE.toLowerCase() == 'dev') {
    console.log('running in dev mode');
} else {
    winston.add(winston.transports.File, {
        filename: 'log.log',
        timestamp: true,
    });

    winston.handleExceptions(new winston.transports.File({
        filename: 'exceptions.log',
        timestamp: true,
        humanReadableUnhandledException: true
    }));

    winston.remove(winston.transports.Console);
}


// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function() {
    console.log("Listening on port %s", server.address().port);
});
