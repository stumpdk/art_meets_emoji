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

            if(!entry.messaging){
                return;
            }
            // Iterate over each messaging event
            entry.messaging.forEach(function(event) {
                if (event.message) {
                    if (event.message.quick_reply && event.message.quick_reply.payload) {
                        handlePayload(event.message.quick_reply.payload, event.sender.id, res);
                        return;
                    }
                    winston.log('info', "received message", event);
                    sendSenderAction(event.sender.id);
                    receivedMessage(event);
                } else if (event.postback) {
                    handlePayload(event.postback.payload, event.sender.id, res);
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

function handlePayload(payload, user_id, res) {
    winston.log('info', 'postback received', payload);
    payload = JSON.parse(payload);

    //Postback actions:
    //subscribe (payload.type*)
    //unsubscribe (payload.type*)
    //unsubscribe_reason (payload.type*, payload.reason*, payload.art_id*)
    //image_reaction (payload.type*,payload.art_id*, payload.reaction*)

    switch (payload.type) {
        case 'subscribe':
            subscribe(user_id);
            break;
        case 'unsubscribe':
            unsubscribe(user_id);
            break;
        case 'get_subscription_status':
            get_subscription_status(user_id);
            break;
        case 'unsubscribe_reason':
            unsubscribeReason(payload);
            break;
        case 'image_reaction':
            sendSenderAction(user_id);
            saveImageResponse(payload);
            break;
        case 'image_nav_continue':
            sendSenderAction(user_id);
            getAssetsByText(user_id, payload.search_term);
            break;
        case 'get_image_info':
            sendSenderAction(user_id);
            getAssetInfoById(user_id, payload.art_id, payload);
            break;
        case 'get_started':
            sendSenderAction(user_id);
            sendTextMessage(user_id, 'Welcome to Art meets Emoji.:) \n\nYou can subscribe to a daily painting by using the "Subscription" button in the menu. \n\nYou can get a random painting by writing "image". \n\nAnd you can search for paintings by keyword by writing "keyword?". Enjoy! :)');
            break;
        default:
            winston.log('warn', 'unhandled postback type. This is the payload: ', payload);
            break;
    }

    function subscribe(userId) {
        db.subscribeUser(userId, function() {
            sendTextMessage(userId, 'You\'re now subscribed. We look forward to sent you paintings. :)');
        });
    }

    function unsubscribe(payload) {
        winston.log('info', 'unsubscribe for user ' + user_id);
        var reason = null;
        db.unsubscribeUser(user_id, reason, function sendStatus() {
            sendUnsubscribeReasonButton(user_id);
        });
    }

    function get_subscription_status(userId) {
        db.getSubscriber(userId, function(results) {
            if (results && results[0].enabled) {
                sendUnsubscribeButton(userId);
            } else {
                sendSubscribeButton(userId);
            }
        });
    }

    function unsubscribeReason(payload) {
        var reason = payload.reason;
        db.unsubscribeUser(user_id, reason, function sendStatus() {
            sendTextMessage(payload.user_id, 'Okay. Got it. Hopefully we\'ll see you again. :)');
        });
    }

    function saveImageResponse(payload) {
        db.saveResponse(payload.art_id, user_id, payload.reaction, respondOnPostback);

        function respondOnPostback() {
            if (payload.reaction == 0) {
                sendImageNavButtons(payload.user_id, payload.art_id, payload.search_term, 'Got that. You won\'t get art like that again. Would you like another?');
            } else {
                sendImageNavButtons(payload.user_id, payload.art_id, payload.search_term, 'Got that. Glad you liked it! :) Continue?');
            }
        }
    }
}


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
                /*    case 'it\'s too often.':
            case 'paintings are ugly':
            case 'i was just curious':
                winston.log('info', 'Got subscription feedback.');
                break;
*/
                //Search art by keyword or get tags from sentence
            default:
                sendSenderAction(senderID);
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
        sendTextMessage(senderID, 'Thank you for your input, we can probaply use it for the image!');
    }
}

function getAssetInfoById(recipientId, id, payload) {
    db.getImageById(id, sendInfo);

    function sendInfo(result) {
        if (result && result[0]) {
            sendImageNavButtons(recipientId, result.id, payload.search_term, 'Here\'s some extra info: ' + result[0].name + ': ' + result[0].title + ', ' + result[0].creation_date + '\nDo you want to get the next painting?');
        } else {
            sendImageNavButtons(recipientId, result.id, payload.search_term, 'Sorry, couldn\'t find any info on the painting. Do you want another one?');
        }
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

        if (result == null || !result || result.length == 0 || !result.id) {
            winston.log('info', 'no result when searching for related images. Trying to search by text: ' + text);
            db.searchImagesByText(recipientId, text, sendImageOrNoResultsText);
            return;
        }
        winston.log('info', 'here is the result: ', result.id, result.title);

        sendImageOrNoResultsText(result, text);
    }

    function sendImageOrNoResultsText(result, text) {
        winston.log('info', "oh no...");
        if (result) {
            winston.log('info', 'heres the result', result.id, result.title);
            sendImageMessage(recipientId, result, text);
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

function sendImageMessage(recipientId, image_data, searchTerm) {
    console.log('info', 'sending image');
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
            },
            quick_replies: [{
                    content_type: "text",
                    title: "Nice! 😍",
                    payload: JSON.stringify({
                        type: 'image_reaction',
                        art_id: image_data.id,
                        reaction: 1,
                        user_id: recipientId,
                        search_term: searchTerm
                    })
                },
                {
                    content_type: 'text',
                    title: 'Nah... 😒',
                    payload: JSON.stringify({
                        type: 'image_reaction',
                        art_id: image_data.id,
                        reaction: 0,
                        user_id: recipientId,
                        search_term: searchTerm
                    })
                }, {
                    content_type: 'text',
                    title: 'Info?',
                    payload: JSON.stringify({
                        type: 'get_image_info',
                        art_id: image_data.id,
                        user_id: recipientId,
                        search_term: searchTerm
                    })
                }
            ]
        }
    };
    callSendAPI(messageData);
    db.insertSeenArt(recipientId, image_data.id);

    //callSendAPI(messageData, sendButtons);

    function sendButtons() {
        sendRespondButtons(recipientId, image_data.title, image_data.id);
    }
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
                                type: 'image_reaction',
                                art_id: art_id,
                                reaction: 1,
                                user_id: recipientId
                            }),
                        }, {
                            type: "postback",
                            title: "Nah... 😒",
                            payload: JSON.stringify({
                                type: 'image_reaction',
                                art_id: art_id,
                                reaction: 0,
                                user_id: recipientId
                            }),
                        }, {
                            type: "element_share"
                        }],
                    }],
                }
            }
        }
    };
    callSendAPI(messageData);
}

function sendImageNavButtons(recipientId, art_id, searchTerm, text) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        message: {
            text: text,
            quick_replies: [{
                    content_type: "text",
                    title: "Sure. :)",
                    payload: JSON.stringify({
                        type: 'image_nav_continue',
                        art_id: art_id,
                        search_term: searchTerm,
                        user_id: recipientId
                    })
                },
                {
                    content_type: 'text',
                    title: 'Nope..',
                    payload: JSON.stringify({
                        //Unhandled
                        type: 'image_nav_stop',
                        art_id: art_id,
                        search_term: searchTerm,
                        user_id: recipientId
                    })
                }
            ]
        }
    };
    callSendAPI(messageData);
}

function sendSubscribeButton(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        /*
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [{
                                title: "You're currently not subscribing to daily paintings. Would you?",
                                buttons: [{
                                    type: "postback",
                                    title: "Sure! :)",
                                    payload: JSON.stringify({
                                        type: 'subscribe',
                                        user_id: recipientId
                                    }),
                                }],
                            }],
                        }
                    }
                },*/
        message: {
            text: "You're currently not subscribing to daily paintings. Would you like to?",
            quick_replies: [{
                    content_type: "text",
                    title: "Sure! :)",
                    payload: JSON.stringify({
                        type: 'subscribe',
                        user_id: recipientId
                    }),
                },
                {
                    content_type: "text",
                    title: "No thanks... ",
                    payload: JSON.stringify({
                        //Unhandled
                        type: 'subscribe_no_thanks',
                        user_id: recipientId
                    })
                }
            ]
        }
    };
    callSendAPI(messageData);
}

function sendUnsubscribeButton(recipientId) {
    var messageData = {
        recipient: {
            id: recipientId
        },
        /*
                message: {
                    attachment: {
                        type: "template",
                        payload: {
                            template_type: "generic",
                            elements: [{
                                title: "You're currently getting a painting once a day. Unsubscribe?",
                                buttons: [{
                                    type: "postback",
                                    title: "Unsubscribe",
                                    payload: JSON.stringify({
                                        type: 'unsubscribe',
                                        user_id: recipientId
                                    }),
                                }],
                            }],
                        }
                    }
                },*/
        message: {
            text: "You're subscribing to one daily painting. Would you like to unsubscribe?",
            quick_replies: [{
                    content_type: "text",
                    title: "Yes, please...",
                    payload: JSON.stringify({
                        type: 'unsubscribe',
                        user_id: recipientId
                    }),
                },
                {
                    content_type: "text",
                    title: "Nope..",
                    payload: JSON.stringify({}),
                }
            ]
        }
    };

    callSendAPI(messageData);
}

function sendUnsubscribeReasonButton(recipientId) {
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
                        title: 'You have unsubscribed. Would you like to tell us why?',
                        buttons: [{
                            type: "postback",
                            title: "It's too often",
                            payload: JSON.stringify({
                                type: 'unsubscribe_reason',
                                reason: 'too_often',
                                user_id: recipientId
                            }),
                        }, {
                            type: "postback",
                            title: "Paintings are ugly",
                            payload: JSON.stringify({
                                type: 'unsubscribe_reason',
                                reason: 'painting_are_ugly',
                                user_id: recipientId
                            }),
                        }, {
                            type: "postback",
                            title: "I was just curious",
                            payload: JSON.stringify({
                                type: 'unsubscribe_reason',
                                reason: 'just_curious',
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

//type can be typing_on, typing_off, mark_seen
function sendSenderAction(recipientId, type) {
    var action = type || 'typing_on';
    callSendAPI({
        "recipient": {
            "id": recipientId
        },
        "sender_action": action
    });
}

function callSendAPI(messageData, cb) {
    if (process.env.SEND_TO_FB && process.env.SEND_TO_FB == 'false') {
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
            console.log('error', "Unable to send message.", response);
            //            winston.log('error', response);
            //            winston.log('error', error);
        }

        if (cb) {
            cb();
        }
    });
}

//Send images to recipients every day at 15 o'clock
var j = schedule.scheduleJob('0 15 * * *', function() {
    winston.log('info', 'Sending messages for recipients now!');
    //Bo, Caroline
    var recipients = [1826099614071392, 2067350629958019];

    recipients.forEach(function(item, index) {
        getAssetsByText(item);
    });
});

if (process.env.LOG && process.env.LOG == 'console') {
    winston.log('info', 'console logging enabled');
} else {
    winston.log('info', 'console logging enabled');
    winston.add(winston.transports.File, {
        filename: '/var/log/nodejs/log.log',
        timestamp: true,
        level: 'info'
    });

    winston.handleExceptions(new winston.transports.File({
        filename: 'exceptions.log',
        timestamp: true,
        humanReadableUnhandledException: true
    }));

    winston.remove(winston.transports.Console);
    winston.log('info', 'file logging enabled');
}


// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function() {
    winston.log('info', "Listening on port %s", server.address().port);
});
