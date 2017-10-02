# SMK Chatbot
Hack4DK project to display images via smk-api, NPL? and Node.js

##Docker up
run docker-compose up

##Database init
Put your .sql files in /db_init to fill in data in MySQL at startup time

##startup
Run `docker-compose up`

Run `node server.js`

Access the webserver on http://localhost:3000

Access the database on localhost:3306 user: user, password: password

## Init
Run `npm install`

## Beautify files
Run `grunt`

## Test call, message
`
{
	"object":"page",
	"entry": [
		{
			"messaging":[
				{
					"message":{ "text": "image?"},
					"sender": {"id": 234234},
					"recipient": {"id": 567575675}
				}]
		}
	]
}
`

## Test call, postback
`
{
	"object":"page",

	"entry": [
		{
			"id":"p98439504",
			"messaging":[
				{	"sender" : {"id":12312},
					"postback":{
					    "title": "unsubscribe_reason",  
					    "payload": "{\"type\": \"unsubscribe_reason\",\"art_id\": \"2114\",\"reaction\": \"too_often\",\"user_id\": 423334}",
						"sender": {"id": 234234},
						"recipient": {"id": 567575675},
					    "referral": {
					      "ref": "<USER_DEFINED_REFERRAL_PARAM>",
					      "source": "<SHORTLINK>",
					      "type": "OPEN_THREAD"
					    }
					}
				}]
		}
	]
} 
`
