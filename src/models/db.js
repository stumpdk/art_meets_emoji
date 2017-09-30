var mysql = require('mysql');

var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'localhost',
  port            : 3306,
  user            : 'root',
  password        : 'example',
  database        : 'art_meets_emoji'
});

module.exports = {
    subscribeUser: function(userId, cb){

        getSubscriber(userId, createOrUpdateExistingSubscription);

        function getSubscriber(userId, cb){
            pool.query({
                sql: 'select user_id, enabled from subscriptions where user_id = ?',
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
                sql: 'update subscriptions set enabled = ?, subscription_date = NOW() WHERE user_id = ?',
                values: [status, userId]
            }, function(error, result, fields){
                if (error) throw error;
            });
        };

        function addNewSubscriber(userId){
            pool.query({
                sql: 'insert into subscriptions (user_id, enabled, subscription_date) VALUES (?, 1, NOW())',
                values: [userId]
            }, function(error, result, fields){
                if (error) throw error;
            });
        };
    },

    unsubscribeUser: function(userId, reason, cb){
        pool.query({
            sql: 'update subscriptions set enabled = 0, reason = ? WHERE user_id = ?',
            values: [reason, userId]
        }, function(error, result, fields){
            if (error) throw error;
            cb();
        });
    },

    getRelatedImages: function(userId, cb){
            pool.query({

            }), function(error, result, fields){

            });
    },

    getImage: function(userId, cb){
        pool.query({
            sql: 'select id, image_url from art limit 100;',
        }, function(error, result, fields){
            if(error) throw error;

            var randomId = Math.rand(0, result.length-1);

            cb(result[randomId]);
        });
    }
    searchImagesByText: function(userId, text, cb){
        pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
          if (error) throw error;
          console.log('The solution is: ', results[0]);

          cb(results);
        });
    }
};
