'use strict'

const solr = require('solr-client');

/**
 * This class maps data from Asset objects to Solr
 */

class AssetSolrDataMapper{
    constructor(){
        this.solr = solr;
    }

    save(assets){
        var docs = [];
        for(var asset of assets){
            docs.push({
                id: asset.id,
                url: asset.image_url,
                colors: asset.colors,
                title: asset.title
            });
        }

        this._addToSolr(docs);
    }

    findByColors(colors){
        var client = this.solr.createClient();

        //First approach: Use Solr's default ranking
        query = {
            q: colorsAsString,
            qf: "colors",
            defType: "edismax"
        };

        //Second approach: Use frequencies of colors and sort by it
        colorsTf = "product(";
        for(var color of colors){
            colorsTf = colorsTf + "tf(color,\"" + color + "\"),"
        }
        colorsTf = colorsTf.substring(0, colorsTf.length()-1);
        colorsTf = colorsTf + ") desc";

        query2 = {
            q: '*:*',
            sort: colorsTf
        }

        client.search(query);
    }

    _addToSolr(docs){
        // Create a client
        var client = this.solr.createClient('solr',8983,'assets');

        // Switch on "auto commit", by default `client.autoCommit = false`
        client.autoCommit = true;

        // Add documents
        client.add(docs,function(err,obj){
           if(err){
              console.log(err);
           }else{
              console.log(obj);
           }
        });

        docs = [];
    }
}

module.exports = AssetSolrDataMapper;
