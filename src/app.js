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
        req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

app.get('/syn', function(req, res) {
    console.log(synonyms(req.query.query));
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
    console.log(req.body);
    var data = req.body;

    // Make sure this is a page subscription
    if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            var pageID = entry.id;
            var timeOfEvent = entry.time;

            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                if (event.message) {
                    receivedMessage(event);
                    console.error("received message",event);
                } else if (event.postback) {
                    //receivedPostback(event);
                    console.error("received postback");
                } else if (event.read){
                    console.error("received read event");
                } else {
                    console.error("Webhook received unknown event: ", event);
                }
            });
        });

        // Assume all went well.
        //
        // You must send back a 200, within 20 seconds, to let us know
        // you've successfully received the callback. Otherwise, the request
        // will time out and we will keep trying to resend.
        res.sendStatus(200);
    }
});

app.post('/subscribe', function(req, res){
    console.log('subscribe endpoint reached');

    var data = req.body;
    if(data.object === 'page'){
        if(req.body['messenger user id']){
            console.warn(data.entry);
            //db.subscribeUser(req.body['messenger user id'])
        }
    }
    else{
        //Didn't receive the right format
        console.warn('unsubscribe data wasn\'t a page');
    }

    res.sendStatus(200);
});

app.post('/unsubscribe', function(req, res) {
    console.log('unsubscribe endpoint reached');

    var data = req.body;
    if(data.object === 'page'){
        if(req.body['messenger user id'] && req.query.reason){
            console.warn(data.entry);
            //db.unsubscribeUser(req.body['messenger user id'], req.query.reason)
        }
    }
    else{
        //Didn't receive the right format
        console.warn('unsubscribe data wasn\'t a page');
    }

    res.sendStatus(200);

});

// Incoming events handling
function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.error("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
//    console.log(JSON.stringify(message));

    var messageId = message.mid;
    console.warn(message.text);
    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
        // If we receive a text message, check to see if it matches a keyword
        // and send back the template example. Otherwise, just echo the text we received.
        switch (messageText) {
            case 'generic':
                sendGenericMessage(senderID);
                break;
            case 'image':
                console.error(messageText);
                sendImageMessage(senderID);
            default:
                getAssetsByText(senderID, messageText);
        }
    } else if (messageAttachments) {
        sendTextMessage(senderID, "Message with attachment received");
    }
}

function getAssetsByText(userId, text){
    db.searchImagesByText(text, outputData);

    function outputData(result){
        res.send(JSON.stringify(results));
    }
}

/*
function receivedPostback(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfPostback = event.timestamp;

    // The 'payload' param is a developer-defined field which is set in a postback
    // button for Structured Messages.
    var payload = event.postback.payload;

    console.log("Received postback for user %d and page %d with payload '%s' " +
        "at %d", senderID, recipientID, payload, timeOfPostback);

    // When a postback is called, we'll send a message back to the sender to
    // let them know it was successful
    sendTextMessage(senderID, "Postback called");
}
*/
//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
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

function sendImageMessage(recipientId){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message:{
        attachment:{
          type:"image",
          payload:{
            url:"http://www.smk.dk/fileadmin/user_upload/Billeder/besoeg-museet/Kalender/2017/Oktober/KN_singleview1.jpg"
            }
            }
        }
    };

    callSendAPI(messageData);
}

/*
function sendGenericMessage(recipientId) {
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
                        title: "rift",
                        subtitle: "Next-generation virtual reality",
                        item_url: "https://www.oculus.com/en-us/rift/",
                        image_url: "http://messengerdemo.parseapp.com/img/rift.png",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/rift/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for first bubble",
                        }],
                    }, {
                        title: "touch",
                        subtitle: "Your Hands, Now in VR",
                        item_url: "https://www.oculus.com/en-us/touch/",
                        image_url: "http://messengerdemo.parseapp.com/img/touch.png",
                        buttons: [{
                            type: "web_url",
                            url: "https://www.oculus.com/en-us/touch/",
                            title: "Open Web URL"
                        }, {
                            type: "postback",
                            title: "Call Postback",
                            payload: "Payload for second bubble",
                        }]
                    }]
                }
            }
        }
    };

    callSendAPI(messageData);
}
*/
function callSendAPI(messageData) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: process.env.PAGE_ACCESS_TOKEN
        },
        method: 'POST',
        json: messageData

    }, function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var recipientId = body.recipient_id;
            var messageId = body.message_id;

            console.log("Successfully sent generic message with id %s to recipient %s",
                messageId, recipientId);
        } else {
            console.error("Unable to send message.", response);
//            console.error(response);
//            console.error(error);
        }
    });
}

//Send images to recipients every 24 hours (or so)
var j = schedule.scheduleJob('* * * * *', function(){
  console.log('Sending messages for recipients now!');
});

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function() {
    console.log("Listening on port %s", server.address().port);
});
