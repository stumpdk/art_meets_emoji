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
    searchFavoritesRelatedImagesByText: function(userId, text, cb){
        console.log('search art for keyword: ', text);
        text = "%"+text+"%"
        pool.query({
            sql: 'SELECT ra.id, ra.title,ra.image_url,ra.creation_date,group_concat(author.name) as author,type.name as type FROM art a ' +
            ' LEFT OUTER JOIN related_art ON a.id = related_art.art_id' +
            ' LEFT OUTER JOIN art ra ON related_art.related_id = ra.id' +
            ' JOIN reaction ON reaction.art_id = a.id' +
            ' LEFT OUTER JOIN seen_art ON seen_art.art_id = ra.id' +
            ' JOIN art_author ON ra.id = art_author.art_id' +
            ' JOIN  author ON art_author.author_id = author.id' +
            ' JOIN  type ON ra.type_id = type.id' +
            ' LEFT OUTER JOIN  tag ON tag.art_id = ra.id' +
            ' WHERE' +
            ' (ra.title LIKE ? OR' +
            ' author.name LIKE ? OR' +
            ' ra.creation_date LIKE ? OR' +
            ' tag.value LIKE ?) ' +
            ' AND reaction.positive = 1 AND reaction.user_id = ?' +
            ' AND (seen_art.user_id is null OR seen_art.user_id != ?)' +
            ' GROUP BY ra.id LIMIT 1',
            values: [text,text,text,text,userId,userId]
        }, function (error, results, fields) {
            if (error) throw error;
            console.log('The solution is: ', results);
            cb(results[0]);
        });
    },

    searchFavoritesRelatedImages: function(userId, cb){
        pool.query({
            sql: 'SELECT ra.id, ra.title,ra.image_url,ra.creation_date,group_concat(author.name) as author,type.name as type FROM art a ' +
            ' LEFT OUTER JOIN related_art ON a.id = related_art.art_id' +
            ' LEFT OUTER JOIN art ra ON related_art.related_id = ra.id' +
            ' JOIN reaction ON reaction.art_id = a.id' +
            ' LEFT OUTER JOIN seen_art ON seen_art.art_id = ra.id' +
            ' JOIN art_author ON ra.id = art_author.art_id' +
            ' JOIN  author ON art_author.author_id = author.id' +
            ' JOIN  type ON ra.type_id = type.id' +
            ' WHERE' +
            ' reaction.positive = 1 AND reaction.user_id = ?' +
            ' (seen_art.user_id is null OR seen_art.user_id != ?)' +
            ' GROUP BY ra.id LIMIT 1',
            values: [userId,userId]
        }, function (error, results, fields) {
            if (error) throw error;
            console.log('The solution is: ', results);
            cb(results[0]);
        });
    },
}