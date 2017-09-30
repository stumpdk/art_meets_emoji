var request = require('request');
var fs = require('fs');

request({
    url: 'http://solr.smk.dk:8080/proxySolrPHP/proxy.php?query=q%3DcollectorAutoCompNG1:(*)%26facet%3Dfalse%26facet.mincount%3D1%26facet.limit%3D-1%26q.op%3DAND%26rows%3D10%26facet.field%3Did%26facet.field%3Dartist_name%26facet.field%3Dtitle_dk%26facet.field%3Dtitle_eng%26facet.field%3Dtitle_first%26facet.field%3Dproveniens%26facet.field%3Dmateriale%26facet.field%3Dobject_type_dk%26facet.field%3Dlocation_kks_kas&wt=json&solrUrl=http%3A%2F%2Fsolr-02.smk.dk%3A8080%2Fsolr%2Fprod_SAFO%2F&language=dk&_=1505940592839',
}, saveToJSON);

function saveToJSON(errorCode, data) {
    if (errorCode) throw errorCode;
    //console.log(data);

    //fields to save;
    //collectorAutoCompNG1 []
    //title_dk
    //title_dk_text
    //artist_name
    //artist_natio_dk []
    //title_first

    var input = data.body.slice(1, -1);
    console.log(data.body);

    convertedDocs = [];
    for (var i = 0; i < input.length; i++) {
        var doc = {};
        var input = input[i];
        doc.push(input.title_dk);
        doc.push(input.title_dk_text);
        doc.push(input.artist_name);
        doc.push(input.artist_natio_dk)
        doc.push(input.title_first);

        for (var j = 0; j < input.collectorAutoCompNG1.lengt - 1; j++) {
            doc.push(input.collectorAutoCompNG1[j]);
        }

        for (var j = 0; j < input.artist_natio_dk.lengt - 1; j++) {
            doc.push(input.artist_natio_dk[j]);
        }

        convertedDocs.push(doc);
    }


    fs.writeFile('smk_data.json', JSON.stringify(convertedDocs), function(err) {
        if (err) throw 'could not save file: ' + err;

        console.log('file saved', convertedDocs);

        //fs.readFile('smk_data.json', function(err, data){
        //console.log(JSON.parse(data));
        //})
    });
}
