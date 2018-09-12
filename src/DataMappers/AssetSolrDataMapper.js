'use strict'

const solr = require('solr-client');

/**
 * This class maps data from Asset objects to Solr
 */

class AssetSolrDataMapper{
    constructor(){
        this.client = solr.createClient('solr',8983,'assets');
    }

    save(assets){
        var docs = [];
        for(var asset of assets){
            docs.push({
                id: asset.id,
                url: asset.image_url,
                colors: asset.prominentColors,
                title: asset.title
            });
        }
        console.log(docs);
        this._addToSolr(docs);
    }

    findByColors(colors){
        //First approach: Use Solr's default ranking
        let query = {
            q: colors.join(" "),
            qf: "colors",
            defType: "edismax"
        };

        //Second approach: Use frequencies of colors and sort by it
        let colorsTf = "product(";
        for(var color of colors){
            colorsTf = colorsTf + "tf(color,\"" + color + "\"),"
        }
        colorsTf = colorsTf.substring(0, colorsTf.length-1);
        colorsTf = colorsTf + ") desc";

        let query2 = {
            q: '*:*',
            sort: colorsTf
        }
        console.log(query);
        return new Promise((fullfill, reject) => {
          this.client.search(query, function(err, obj){
            if(err) {
              console.log(err);
              reject(err);
            }

            fullfill(obj);
          });
        });
    }

    _addToSolr(docs){

        // Switch on "auto commit", by default `client.autoCommit = false`
        this.client.autoCommit = true;

        // Add documents
        this.client.add(docs,function(err,obj){
          //console.log(docs[0]);

           if(err){
              console.log(err);
           }else{
              this.client.commit();
              docs = [];
           }
        });
    }
}

module.exports = AssetSolrDataMapper;
