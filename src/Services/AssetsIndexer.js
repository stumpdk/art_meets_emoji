'use strict'

var limit = require("simple-rate-limiter");
var request = limit(require("request")).to(5).per(1000);

/**
 * This class indexes assets in Solr
 */
class AssetsIndexer {
    constructor(assetDataMapper, assetSolrDataMapper, imageDataMapper){
        this.assetDM = assetDataMapper;
        this.assetSolrDM = assetSolrDataMapper;
        this.imageDataMapper = imageDataMapper;
    }

    indexAssets(){
        this.assetDM.getAssetsAndColors()
        .then((data) => {
          this.assetSolrDM.save(data);
        });
    }

    test2(){

    }

    test(){
      let that = this;
      return new Promise(function(fullfill, reject){

      let promises = [];
      //Get assets and color data for each
      that.assetDM.getAssets()
      .then(data => {
        let newArr = data.slice(0,250);
        for(let asset of newArr){
          promises.push(that.imageDataMapper.getPixels(asset.image_url));
        }
        //Wait for results
        let results = Promise.all(promises);
        results.then(data => {
          let i = 0;
          for(let row of data){
            newArr[i].prominentColors = row;
            i = i+1;
          }
          console.log(newArr[0].prominentColors[0], newArr[0].image_url);
          fullfill(newArr);
          return;

        });
      });
    });

    }
}

module.exports = AssetsIndexer;
