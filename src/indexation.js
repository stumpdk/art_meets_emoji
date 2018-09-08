'use strict';
const AssetsIndexer = require('./Services/AssetsIndexer.js');
const AssetDataMapper = require('./DataMappers/Asset')
const AssetSolr = require('./DataMappers/AssetSolr')
console.log(AssetsIndexer);


var is = new AssetsIndexer(new AssetDataMapper(), new AssetSolr());
is.indexAssets();
