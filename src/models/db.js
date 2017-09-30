var mysql = require('mysql');

var pool  = mysql.createPool({
  connectionLimit : 10,
  host            : 'example.org',
  user            : 'bob',
  password        : 'secret',
  database        : 'my_db'
});

module.export = {
    subscribeUser = function(userId){
        pool.query('insert into subscribtions (user, subscribtion_date) VALUES ()', );
    },
    searchImagesByText = function(userId, text, cb){

        pool.query('SELECT 1 + 1 AS solution', function (error, results, fields) {
          if (error) throw error;
          console.log('The solution is: ', results[0]);
          cb(results);
        });
    }
};
