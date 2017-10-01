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

            });
    },

    getImage: function(userId, cb){
        console.warn('searching for images');
        pool.query({
            sql: 'select art.id,art.title,art.image_url,art.creation_date from art limit 5000',
        }, function(error, result, fields){
            if(error) throw error;

            var randomId = Math.floor(Math.random() * result.length-1) + 1;

            cb([result[randomId]]);
        });
    },

    searchImagesByText: function(userId, text, cb){
        console.log('search art for keyword: ', text);
        text = "%"+text+"%"
        pool.query({
            sql: 'SELECT DISTINCT art.id,art.title,art.image_url,art.creation_date,group_concat(author.name) as author,type.name as type FROM art ' +
            ' JOIN art_author ON art.id = art_author.art_id ' +
            ' JOIN  author ON art_author.author_id = author.id' +
            ' JOIN  type ON art.type_id = type.id' +
            ' LEFT OUTER JOIN seen_art ON seen_art.art_id = art.id' +
            ' LEFT OUTER JOIN  tag ON tag.art_id = art.id' +
            ' WHERE ' +
            ' (art.title LIKE ? OR' +
            ' author.name LIKE ? OR' +
            ' art.creation_date LIKE ? OR' +
            ' tag.value LIKE ?)'+
            ' AND (seen_art.user_id is null OR seen_art.user_id != ?)' +
            ' GROUP BY art.id' +
            ' ORDER BY count(art.id) DESC LIMIT 1',
            values: [text,text,text,text,userId]
        }, function (error, results, fields) {
            if (error) throw error;
            console.log('The solution is: ', results[0]);
            cb(results[0]);
        });
    },

    insertSeenArt: function (userId, artId) {
        pool.query({
            sql: 'INSERT INTO seen_art (art_id, user_id) VALUES (?,?)',
            values: [user_id, art_id]
        }, function(error, results, fields){
            if(error) throw error;
            console.warn('saved seen_art');
        });
    },

    saveResponse(art_id, user_id, response, cb){
        console.warn(user_id);
        pool.query({
            sql: 'INSERT INTO reaction (user_id, art_id, positive, time_for_reaction) VALUES (?,?,?, NOW())',
            values: [user_id, art_id, response]
        }, function(error, results, fields){
            if(error) throw error;
            console.warn('saved user reaction');

            if(cb){
                cb();
            }
        });
    },

    saveTags(user_id, tags, cb){
        //Check the latest artwork that the user responded to
        pool.query({
            sql: 'SELECT * FROM reaction WHERE user_id = ?',
            values: [user_id]
        }, function(error, results, fields){
            if(error) throw error;

            if(results.length == 0){
                return;
            }

            saveTags(results[0].art_id, results[0].user_id, tags, cb);
        });

        function saveTags(art_id, user_id, tags){
            var query = 'INSERT INTO tag (user_id, art_id, value) VALUES ';
            for(var i = 0; i< tags.length; i++){
                query = query + ' (' + user_id + ', ' + art_id + ', \'' + tags[i] + '\'),'
            }
            query = query.substring(0, query.length - 1);
            console.log(query);
            if(tags.length == 0){
                cb();
                return;
            }
            pool.getConnection(function(err, connection) {
              // connected! (unless `err` is set)
              connection.query(query, function(error, results, fields){
                  if(error) throw error;

                  if(cb){
                      cb(results);
                  }
              });
            });
        };
    }
};
