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
const db = require('../src/models/db');
const text = require('../src/models/textParser');
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
        req.query['hub.verify_token'] === 'test'/*process.env.VERIFY_TOKEN*/) {
        console.log("Validating webhook");
        res.status(200).send(req.query['hub.challenge']);
    } else {
        console.error("Failed validation. Make sure the validation tokens match.");
        res.sendStatus(403);
    }
});

app.get('/syn', function(req, res) {
    text.test2('this is a test string containing words like yellow, happy, angry and Copenhagen');
    //console.log(synonyms(req.query.query));
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

    console.warn('got request', data);


    // Make sure this is a page subscription
    if (data.object === 'page') {

        // Iterate over each entry - there may be multiple if batched
        data.entry.forEach(function(entry) {
            var pageID = entry.id;
            var timeOfEvent = entry.time;

            if(!entry.messaging){
                console.warn('unhandled event:', entry);
            }
            else{

                // Iterate over each messaging event
                entry.messaging.forEach(function(event) {
                    if (event.message) {
                        receivedMessage(event);
                        console.error("received message",event);
                    } else if (event.postback) {
                        //receivedPostback(event);
                        console.error("received postback", event);
                        handlePostBack(event.postback);
                    } else if (event.read){
                        console.error("received read event");
                    } else {
                        console.error("Webhook received unknown event: ", event);
                    }
                });
            }
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

function handlePostBack(postback){
    var payload = JSON.parse(postback.payload);
    db.saveResponse(payload.art_id, payload.user_id, payload.reaction, respondOnPostback);

    function respondOnPostback(){
        if(payload.reaction == 0){
            sendTextMessage(payload.user_id, 'Got that. You won\'t get art like that again.' );
        }
        else{
            sendTextMessage(payload.user_id, 'Got that. Glad you liked it! :)');
        }
    }
}

app.post('/subscribe', function(req, res){
    console.warn(db);
    console.log('subscribe endpoint reached');

    var data = req.body;
    //if(data.object === 'page'){
        if(req.body['messenger user id']){
            console.warn(data.entry);
            db.subscribeUser(req.body['messenger user id'])
        }
        else{
            console.warn('message user id not set!');
        }
//    }
//    else{
        //Didn't receive the right format
//        console.warn('subscribe data wasn\'t a page');
//    }

    res.sendStatus(200);
});

app.post('/unsubscribe', function(req, res) {
    console.log('unsubscribe endpoint reached');

    var data = req.body;
    //if(data.object === 'page'){
        if(req.body['messenger user id']){
            var reason =  req.query.reason || false;
            console.warn(data.entry);
            db.unsubscribeUser(req.body['messenger user id'], reason, function sendStatus(){
                res.sendStatus(200);
            });
        }
//    }
//    else{
        //Didn't receive the right format
    //    console.warn('unsubscribe data wasn\'t a page');
//    }



});

// Incoming events handling
function receivedMessage(event) {
    var senderID = event.sender.id;
    var recipientID = event.recipient.id;
    var timeOfMessage = event.timestamp;
    var message = event.message;

    console.warn("Received message for user %d and page %d at %d with message:",
        senderID, recipientID, timeOfMessage);
//    console.log(JSON.stringify(message));

    var messageId = message.mid;
    console.warn(message.text);
    var messageText = message.text;
    var messageAttachments = message.attachments;

    if (messageText) {
        // If we receive a text message, check to see if it matches a keyword
        // and send back the template example. Otherwise, just echo the text we received.
        switch (messageText.toLowerCase()) {
            /*case 'generic':
                sendGenericMessage(senderID);
                break;*/
            case 'image':
                console.error('search for image', messageText);
                //getAssetsByText(senderID, messageText);
                getAssetsByText(senderID);
                break;
                //break;
        /*    case 'text':
                sendTextMessage(senderID, 'hej');
                break;*/

            case 'it\'s too often.':
            case 'paintings are ugly':
            case 'i was just curious':
                console.log('Got subscription feedback.');
            break;
            default:
//                sendTextMessage(senderID, 'hej');
                //sendImageMessage(senderID);

                //Check for question mark
                if(messageText.indexOf('?') !== -1){
                    //var keyword = messageText.split()
                    var n = messageText.split(" ");
                    getAssetsByText(senderID, n[n.length - 1].replace('?', ''));
                }
                else{
                    //Otherwise get NERs from sentence
                    //db.save(NER.get(), sendThankYou);
                    var n = messageText.split(" ");

                    db.saveTags(senderID, n);

                    function sendThankYouMessage(){
                        sendTextMessage(senderID, 'Thank you for your input, I can probaply use it for the image!');
                    }
                }

                break;
        }
    } else if (messageAttachments) {
//        sendTextMessage(senderID, "Message with attachment received");
    }
}

function getAssetsByText(recipientId, text){
    if(text == undefined){
        db.getImage(recipientId, outputData);
        return;
    }

    db.searchImagesByText(recipientId,text, outputData);
    console.log("sending assets by text");

    function outputData(result){
        if(result){
            console.warn('heres the result',result);
            sendImageMessage(recipientId,result);
        }
        else{
            sendTextMessage(recipientId, "Sorry, I couldn't find anything for you. Want a random painting? Write \"image\". Looking for something particular? Write a name, year, or title and an \"?\" Then we'll go through our collection to see if we have something for you!");
        }
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

function sendImageMessage(recipientId,image_data){
    var messageData = {
        recipient: {
            id: recipientId
        },
        message:{
    attachment:{
      type:"image",
      payload:{
        url:image_data.image_url
      }
    }
  }
    };

    callSendAPI(messageData, sendButtons);

    function sendButtons(){
        sendRespondButtons(recipientId, image_data.title, image_data.id);
    };
}

function sendRespondButtons(recipientId, image_title, art_id){
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
              title: "Nice!",
              payload: JSON.stringify({type: 'reaction', art_id: art_id, reaction:1, user_id: recipientId}),
          },{
            type: "postback",
            title: "Nah!",
            payload: JSON.stringify({type: 'reaction', art_id: art_id, reaction:0, user_id: recipientId}),
            }],
                    }],
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
function callSendAPI(messageData, cb) {
    request({
        uri: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {
            access_token: 'EAAMZC2kJZAfcgBAFwJjoZBxp8VqdqOKj32LygDJfb8VudmgiwbOTG4tlfbVu54WHGR9SAaiSHOmsZBSwnuWinveQi6ZCWt2YgtSrDSQz9ZA5SNhDRZBz8SHUJR6zuyZA7xK2tfJEJSOFNzM5mXFUUhggTQ3tO3KFw6BkMrtHm1SZAZAAZDZD'
        },
        method: 'POST',
        json: messageData,
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

        if(cb){
            cb();
        }
    });
}

//Send images to recipients every 24 hours (or so)
/*var j = schedule.scheduleJob('* * * * *', function(){
  console.log('Sending messages for recipients now!');
});*/

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function() {
    console.log("Listening on port %s", server.address().port);
});
