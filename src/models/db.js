var mysql = require('mysql');

var pool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.RDS_HOSTNAME,
    port: process.env.RDS_PORT,
    user: process.env.RDS_USERNAME,
    password: process.env.RDS_PASSWORD,
    database: process.env.RDS_DB_NAME
});

module.exports = function(winston) {
    var module = {};

    module.changeSubscription = function(userId, cb) {
        var query = 'select enabled from user where user_id = ?';
        pool.query({
            sql: query,
            values: [userId]
        }, handleResult);

        function handleResult(error, results, fields) {
            //No results, add user
            if (!results || results[0].enabled == 0) {
                subscribeUser(userId, cb);
            } else {
                if (results[0].enabled == 1) {
                    unsubscribeUser(userId, null, cb);
                }
            }
        }
    };

    module.getSubscriber = function(userId, cb) {
        pool.query({
            sql: 'select id, enabled from user where id = ?',
            values: [userId]
        }, function(error, results, fields) {
            if (error) throw error;

            cb(results);
        });
    };

    module.subscribeUser = function(userId, cb) {

            this.getSubscriber(userId, createOrUpdateExistingSubscription);

            function createOrUpdateExistingSubscription(results) {
                if (results && results.length == 1) {
                    updateSubscriber(userId, 1, cb);
                } else {
                    addNewSubscriber(userId, cb);
                }
            }

            function updateSubscriber(userId, status, cb) {
                pool.query({
                    sql: 'update user set enabled = ?, reason = null, subscription_date = NOW() WHERE id = ?',
                    values: [status, userId]
                }, function(error, result, fields) {
                    if (error) throw error;

                    if (cb) {
                        cb();
                    }
                });
            };

            function addNewSubscriber(userId, cb) {
                pool.query({
                    sql: 'insert into user (id, enabled, subscription_date) VALUES (?, 1, NOW())',
                    values: [userId]
                }, function(error, result, fields) {
                    if (error) throw error;

                    if (cb) {
                        cb();
                    }
                });
            }
        },

        module.unsubscribeUser = function(userId, reason, cb) {
            pool.query({
                sql: 'update user set enabled = 0, reason = ? WHERE id = ?',
                values: [reason, userId]
            }, function(error, result, fields) {
                if (error) throw error;
                cb();
            });
        },

        module.getRelatedImages = function(userId, cb) {
            pool.query({

            }, function(error, result, fields) {

            });
        },

        module.getImageById = function(id, cb) {
            winston.log('info', 'searching for image by id');
            pool.query({
                sql: 'select art.id,art.title,art.image_url,DATE_FORMAT(art.creation_date, "%Y") as creation_date, author.name from art LEFT JOIN art_author ON art.id = art_author.art_id LEFT JOIN author ON art_author.author_id = author.id where art.id = ?',
                values: [id]
            }, function(error, result, fields) {
                if (error) throw error;
                if (!result || !result[0]) {
                    cb([]);
                }
                cb([result[0]]);
            });
        },

        module.getImage = function(userId, cb) {
            winston.log('info', 'searching for images');
            pool.query({
                sql: 'select art.id,art.title,art.image_url,art.creation_date from art limit 500',
            }, function(error, result, fields) {
                if (error) throw error;

                var randomId = Math.floor(Math.random() * result.length - 1) + 1;

                cb([result[randomId]]);
            });
        },

        module.searchImagesByText = function(userId, text, cb) {
            winston.log('info', 'search art for keyword: ', text);
            var orgText = text;
            text = "%" + text + "%"
            var query = 'SELECT DISTINCT art.id,art.title,art.image_url,art.creation_date,group_concat(author.name) as author,type.name as type FROM art ' +
                ' JOIN art_author ON art.id = art_author.art_id ' +
                ' JOIN  author ON art_author.author_id = author.id' +
                ' JOIN  type ON art.type_id = type.id' +
                ' LEFT OUTER JOIN seen_art ON seen_art.art_id = art.id' +
                ' LEFT OUTER JOIN  tag ON tag.art_id = art.id' +
                ' WHERE ' +
                ' (art.title LIKE ? OR' +
                ' author.name LIKE ? OR' +
                ' art.creation_date LIKE ? OR' +
                ' tag.value LIKE ?)' +
                ' AND (seen_art.user_id is null OR seen_art.user_id != ?)' +
                ' GROUP BY art.id' +
                ' ORDER BY count(art.id) DESC LIMIT 100';

            pool.query({
                sql: query,
                values: [text, text, text, text, userId]
            }, function(error, results, fields) {
                if (error) throw error;
                winston.log('info', 'Results from the text search: ', results.length);
                var randomId = Math.floor(Math.random() * results.length - 1) + 1;

                if (!results || !results[randomId]) {
                    cb();
                    return;
                }
                cb(results[randomId], orgText);
            });
        },

        module.insertSeenArt = function(userId, artId) {
            winston.log('info', 'seen art', userId, artId);
            pool.query({
                sql: 'INSERT INTO seen_art (user_id, art_id) VALUES (?,?)',
                values: [userId, artId]
            }, function(error, results, fields) {
                if (error) throw error;
                winston.log('info', 'saved seen_art');
            });
        },

        module.saveResponse = function(art_id, user_id, response, cb) {
            winston.log('info', user_id);
            pool.query({
                sql: 'INSERT INTO reaction (user_id, art_id, positive, time_for_reaction) VALUES (?,?,?, NOW())',
                values: [user_id, art_id, response]
            }, function(error, results, fields) {
                if (error) throw error;
                winston.log('info', 'saved user reaction');

                if (cb) {
                    cb();
                }
            });
        },

        module.saveTags = function(user_id, tags, cb) {
            //Check the latest artwork that the user responded to
            pool.query({
                sql: 'SELECT * FROM reaction WHERE user_id = ?',
                values: [user_id]
            }, function(error, results, fields) {
                if (error) throw error;

                if (results.length == 0) {
                    return;
                }

                saveTags(results[0].art_id, results[0].user_id, tags, cb);
            });

            function saveTags(art_id, user_id, tags) {
                var query = 'INSERT INTO tag (user_id, art_id, value) VALUES ';
                for (var i = 0; i < tags.length; i++) {
                    query = query + ' (' + user_id + ', ' + art_id + ', \'' + tags[i] + '\'),'
                }
                query = query.substring(0, query.length - 1);
                winston.log('info', query);
                if (tags.length == 0) {
                    cb();
                    return;
                }
                pool.getConnection(function(err, connection) {
                    // connected! (unless `err` is set)
                    connection.query(query, function(error, results, fields) {
                        if (error) throw error;

                        if (cb) {
                            cb(results);
                        }
                    });
                });
            };
        }

    return module;
};
