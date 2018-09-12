'use strict';

const util        = require('util');
const knex        = require('knex')({
  client: 'mysql2',
  version: '5.7',
  connection: {
    host :      process.env.DB_HOSTNAME,
    user :      process.env.DB_USERNAME,
    password :  process.env.DB_PASSWORD,
    database :  process.env.DB_DB_NAME
  },
  pool: { min: 0, max: 7 }
});


class AssetDataMapper {
    constructor(imageDataMapper){
      this.imageDM = imageDataMapper;
      this.knex = knex;
    }

    getAssets(limit){
        const queryLimit = limit || 500;
        let response = this.knex('art')
            .select('art.id','art.title','art.image_url','art.creation_date')
            .limit(queryLimit);

        return response;
    }

    getAsset(id){
      return this.knex('art')
        .leftJoin('art_author', 'user.id', 'art_author.user_id')
        .leftJoin('author', 'art_author.author_id', 'author.id')
        .select(
            'art.id','art.title',
            'art.image_url',
            'DATE_FORMAT(\'art_creation_date\', "Y")',
            'author.name'
        )
        .where({
            'art.id': id
        });
    }

    getAssetsByText(text){
    /*  SELECT art.id,art.title_dk as title,art.medium_image_url as image_url,creation_dk as creation_date,artist_name_text as author,materiale_type as type FROM new_import2 as art ' +
          ' LEFT OUTER JOIN seen_art ON seen_art.art_id = art.id' +
          ' WHERE ' +
          ' (art.title_dk LIKE ? OR' +
          ' art.artist_name_text LIKE ? OR' +
          ' art.creation_dk LIKE ? ' +
          ' AND (seen_art.user_id is null OR seen_art.user_id != ?))' +
          ' ORDER BY id DESC LIMIT 100*/

        return this.knex('new_import2 as art')
          .select(
              'art.id',
              'art.title_dk as title',
              'art.medium_image_url as image_url',
              'creation_dk as creation_date',
              'artist_name_text as author',
              'materiale_type as type'
          )
          .where('title', text)
          .orWhere('author', text)
          .order('art.id desc')
          .limit(100);
    }

    getAssetsRelated(asset){

    }

    getAssetsAndColors(){
      let that = this;
      return new Promise(function(fullfill, reject){
        that.getAssets()
        .then(function(assets){
          console.log('her',assets[0]);

          for(let asset of assets){
              //Get the 400 most occuring colors of images with a maximum of 8000 colors
              that.imageDM.getFileFromUrl(asset.image_url)
                .then(data => that.imageDM.getColorInfo(data, 6))
                .catch(err => console.log('error getting colors',err))
                .then(colors => asset.colors = colors)

                break;
          }

          fullfill(assets);

        })
        .catch(err => console.log('could not get assets',err));
      });
    }
}

module.exports = AssetDataMapper;
