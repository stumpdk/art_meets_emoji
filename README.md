# SMK Chatbot
Hack4DK project to display paintings and other works of art.

Based on open data from SMK, the Danish National Gallery.

The original data (in CSV format) can no longer be found here: http://demoapi.smk.dk/SMK.csv

## Usage
This repository is a backend that receives messages from and sends messages to Facebook users using the Facebook Messenger API.

To make it operational fill out the .env file with your info.

To simply test the functionality you can run `docker-compose up`, which will create a running node instance as well as a database with the basic data structure and artwork data.


## Development
### Init
Run `npm install`

### Database data
Put any .sql file in /db_init, and they will be executed at MySQL start

### Beautify files
Run `grunt beautify` for single beautification or `grunt` to watch for changes

### With existing database: Start node
Run `node server.js`

Access the webserver on http://localhost:3000

### Without existing database: Run database and Node.js with Docker Compose
Run `docker-compose up`

Access the database on localhost:3306

### Test call, message
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

### Test call, postback
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
