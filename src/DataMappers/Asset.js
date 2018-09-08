'use strict';

const MySQLDriver = require('node-data-mapper-mysql').MySQLDriver;
const driver      = new MySQLDriver(require('../bikeShopConOpts.json'));
const util        = require('util');

class AssetDataMapper {
    constructor(imageDataMapper){
      this.driver = driver;
      this.imageDM = imageDataMapper;
    }

    getAssets(limit){
      queryLimit = limit || 500;
      var query = dataContext
        .from('art')
        .select('art.id','art.title','art.image_url','art.creation_date')
        limit(queryLimit);

      return query.execute();
    }

    getAsset(id){
      var query = dataContext
        .from('art')
        .leftJoin('art.art_author')
        .leftJoin('art.author')
        .select(
          'art.id','art.title','art.image_url',
          'DATE_FORMAT(\'art_creation_date\', "Y")','author.name'
        )
        .where({
          eq: {
            'art.id': ':id'
          }
        },
        {
          'id': id
        });

        return query.execute();
    }

    getAssetsByText(text){
      SELECT art.id,art.title_dk as title,art.medium_image_url as image_url,creation_dk as creation_date,artist_name_text as author,materiale_type as type FROM new_import2 as art ' +
          ' LEFT OUTER JOIN seen_art ON seen_art.art_id = art.id' +
          ' WHERE ' +
          ' (art.title_dk LIKE ? OR' +
          ' art.artist_name_text LIKE ? OR' +
          ' art.creation_dk LIKE ? ' +
          ' AND (seen_art.user_id is null OR seen_art.user_id != ?))' +
          ' ORDER BY id DESC LIMIT 100
      var query = dataContext
        .select(
          'art.id',
          {'column': 'art.title_dk', 'mapTo': 'title'},
          {'column': 'art.medium_image_url', 'mapTo': 'image_url'},
          {'column': 'creation_dk', 'mapTo': 'creation_date'},
          {'column': 'artist_name_text', 'mapTo': 'author'},
          {'column': 'materiale_type', 'mapTo'; "type"},
          {'column': }

        )
        .from('new_import2 as art')
        .where({
          eq: {
            'title' : ':text',
            'author' : ':text'
          },
          {
            'text': text
          }
        })
        .orderBy('id DESC')
        .limit(100);

        return query.execute();
    }

    getAssetsRelated(asset){

    }

    getAssetsAndColors(){
        var assets = this.getAssets();
        for(var asset of assets){
            //Get the 400 most occuring colors of images with a maximum of 8000 colors
            asset.colors = this.imageDM.getOftenOccuringColors(
              this.imageDM.getReducedNumberOfColors(asset.image_url, 8000),
              400
            );
        }

        return assets;
    }
}

module.exports = AssetDataMapper;
