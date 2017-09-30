var http = require("http");

/**
 * getJSON:  REST get request returning JSON object(s)
 * @param options: http options object
 * @param callback: callback to pass the results JSON object(s) back
 */
exports.getJSON = function(options, onResult) {
    console.log("rest::getJSON");

    var port = http;
    var req = port.get(options.url, function(res) {
        console.log('hej');
        var output = '';
        console.log(options.host + ':' + res.statusCode);
        res.setEncoding('utf8');

        res.on('data', function(chunk) {
            output += chunk;
            console.log('jer', output);

        });

        res.on('end', function() {
            console.log('jer', output);
            var obj = JSON.parse(output);
            onResult(res.statusCode, obj);
        });
    });

    req.on('error', function(err) {
        //res.send('error: ' + err.message);
    });

    req.end();
};
