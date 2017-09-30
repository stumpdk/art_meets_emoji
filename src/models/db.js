var mysql = require('mysql');

var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  port            : 3307,
  user            : 'root',
  password        : 'example',
  database        : 'art_meets_emoji'
});

module.exports = {
    subscribeUser: function(userId, cb){

        getSubscriber(userId, createOrUpdateExistingSubscription);

        function getSubscriber(userId, cb){
            pool.query({
                sql: 'select id, enabled from user where id = ?',
                values : [userId]
            }, function(error, results, fields){
                if (error) throw error;

                cb(error, results, fields);
            });
        };

        function createOrUpdateExistingSubscription(error, results, fields){
            if(results.length == 1){
                updateSubscriber(userId, 1, cb);
            }
            else{
                addNewSubscriber(userId, cb);
            }
        };

        function updateSubscriber(userId, status, cb){
            pool.query({
                sql: 'update user set enabled = ?, subscription_date = NOW() WHERE id = ?',
                values: [status, userId]
            }, function(error, result, fields){
                if (error) throw error;
            });
        };

        function addNewSubscriber(userId){
            pool.query({
                sql: 'insert into user (id, enabled, subscription_date) VALUES (?, 1, NOW())',
                values: [userId]
            }, function(error, result, fields){
                if (error) throw error;
            });
        };
    },

    unsubscribeUser: function(userId, reason, cb){
        pool.query({
            sql: 'update user set enabled = 0, reason = ? WHERE id = ?',
            values: [reason, userId]
        }, function(error, result, fields){
            if (error) throw error;
            cb();
        });
    },

    getRelatedImages: function(userId, cb){
            pool.query({

            }, function(error, result, fields){

            };
    },

    getImage: function(userId, cb){
        pool.query({
            sql: 'select id, image_url from art limit 100',
        }, function(error, result, fields){
            if(error) throw error;

            var randomId = Math.floor(Math.random() * result.length-1) + 1;

            cb(result[0]);
        });
    },

    searchImagesByText: function(userId, text, cb) {
        console.log(text);
        text = "%"+text+"%"
        pool.query({
            sql: 'SELECT DISTINCT art.id,art.title,art.image_url,art.creation_date FROM art ' +
            'JOIN art_author ON art.id = art_author.art_id ' +
            'JOIN  author ON art_author.author_id = author.id' +
            ' WHERE art.title LIKE ? OR' +
            ' author.name LIKE ? OR' +
            ' art.creation_date LIKE ?' +
            ' GROUP BY art.id' +
            ' ORDER BY count(art.id) DESC LIMIT 0,5',
            values: [text,text,text]
        }, function (error, results, fields) {
            if (error) throw error;
            console.log('The solution is: ', results);
            cb(results);
        });
    }
};
