'use strict';
const dotenv              = require('dotenv').config();
const AssetsIndexer       = require('./Services/AssetsIndexer.js');
const AssetDataMapper     = require('./DataMappers/AssetDataMapper.js');
const AssetSolrDataMapper = require('./DataMappers/AssetSolrDataMapper.js');
const ImageDataMapper     = require('./DataMappers/ImageDataMapper.js');
const chroma = require('chroma-js');

let as = new AssetSolrDataMapper();

let colors  =  ["#c9cccf", "#cbcdd0"];
//let colors = [chroma('pink').hex(), chroma('brown').hex()];

as.findByColors(colors).then(data => {
  console.log(data.response);
});
