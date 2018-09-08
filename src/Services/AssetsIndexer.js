'use strict'
/**
 * This class indexes assets in Solr
 */
class AssetsIndexer {
    constructor(assetDataMapper, assetSolrDataMapper){
        this.assetDM = assetDataMapper;
        this.assetSolrDM = assetSolrDataMapper;
    }

    indexAssets(){
        this.assetSolrDM.save(
            this.assetDM.getAssetsAndColors()
        );
    }
}

module.exports = AssetsIndexer;
