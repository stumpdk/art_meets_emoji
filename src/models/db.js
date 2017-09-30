var mysql = require('mysql');

var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'example.org',
  user            : 'bob',
  password        : 'secret',
  database        : 'my_db'
});

module.export = {
    subscribeUser = function(userId, cb){

        getSubscriber(userId, createOrUpdateExistingSubscription);

        function getSubscriber(userId, cb){
            pool.query({
                sql: 'select user_id, enabled from subscribtions where user_id = ?',
                values : [userId]
            }, function(error, results, fields){
                if error throw error;

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
                sql: 'update subscriptions set (enabled = ?, subscribtion_date = NOW()) WHERE user_id = ?',
                values: [status, userId]
            }, function(error, result, fields){
                if error throw error;
            });
        };

        function addNewSubscriber(userId){
            pool.query({
                sql: 'insert into subscriptions (user_id, enabled, subscribtion_date) VALUES (?, 1, NOW())',
                values: [userId]
            }, function(error, result, fields){
                if error throw error;
            });
        };
    },

    unsubscribeUser = function(userId, reason, cb){
        var reason = reason || null;

        pool.query({
            sql: 'update subscriptions set enabled = 0 AND reason = ? WHERE user_id = ?',
            values: [reason, userId]
        }, function(error, result, fields){
            if error throw error;
            cb();
        });
    },

    searchImagesByText = function(userId, text, cb){
        pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
          if (error) throw error;
          console.log('The solution is: ', results[0]);

          cb(results);
        });
    }
};
