'use strict';
const dotenv              = require('dotenv').config();
const AssetsIndexer       = require('./Services/AssetsIndexer.js');
const AssetDataMapper     = require('./DataMappers/AssetDataMapper.js');
const AssetSolrDataMapper = require('./DataMappers/AssetSolrDataMapper.js');
const ImageDataMapper     = require('./DataMappers/ImageDataMapper.js');


var is = new AssetsIndexer(new AssetDataMapper(), new AssetSolrDataMapper(), new ImageDataMapper());
is.test().then(data => {
  let as = new AssetSolrDataMapper();
  as.save(data);
  return;
});


return;
