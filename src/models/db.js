var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 10,
    host: 'db',
    user: 'user',
    password: 'password',
    database: 'art_meets_emoji',
    port: 3307
});

module.exports = {
    subscribeUser: function (userId, cb) {

        getSubscriber(userId, createOrUpdateExistingSubscription);

        function getSubscriber(userId, cb) {
            pool.query({
                sql: 'select user_id, enabled from subscribtions where user_id = ?',
                values: [userId]
            }, function (error, results, fields) {
                if (error) throw error;

                cb(error, results, fields);
            });
        };

        function createOrUpdateExistingSubscription(error, results, fields) {
            if (results.length == 1) {
                updateSubscriber(userId, 1, cb);
            }
            else {
                addNewSubscriber(userId, cb);
            }
        };

        function updateSubscriber(userId, status, cb) {
            pool.query({
                sql: 'update subscriptions set (enabled = ?, subscribtion_date = NOW()) WHERE user_id = ?',
                values: [status, userId]
            }, function (error, result, fields) {
                if (error) throw error;
            });
        };

        function addNewSubscriber(userId) {
            pool.query({
                sql: 'insert into subscriptions (user_id, enabled, subscribtion_date) VALUES (?, 1, NOW())',
                values: [userId]
            }, function (error, result, fields) {
                if (error) throw error;
            });
        };
    },

    unsubscribeUser: function (userId, reason, cb) {
        pool.query({
            sql: 'update subscriptions set enabled = 0 AND reason = ? WHERE user_id = ?',
            values: [reason, userId]
        }, function (error, result, fields) {
            if (error) throw error;
            cb();
        });
    },

    searchImagesByText: function (userId, text, cb) {
        pool.query({
            sql: 'SELECT DISTINCT art.id,art.title,art.image_url,art.creation_date FROM art ' +
            'JOIN art_author ON art.id = art_author.art_id ' +
            'JOIN  author ON art_author.author_id = author.id' +
            ' WHERE art.title LIKE "%?%" OR' +
            ' author.name LIKE "%?%" OR' +
            ' art.creation_date LIKE "%?%"' +
            'GROUP BY art.id,title,image_url' +
            'ORDER BY count(art.id) DESC',
            values: [text,text,text]
        }, function (error, results, fields) {
            if (error) throw error;
            console.log('The solution is: ', results[0]);
            cb(results);
        });
    }
};
