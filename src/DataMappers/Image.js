'use strict'

const imagemagick = require('imagemagick');
const fs          = require('fs');

/**
 * This class extracts data from images using ImageMagick as its driver
 */

class Image {
    constructor(imagemagick){
      this.imagemagick = imagemagick;
    }

    getDataFromFile(file){
        return fs.readFileSync(file);
    }

    getReducedNumberOfColors(file, numOfColors){
        var result = this.imagemagick.quantize({
            srcData: fs.readFileSync(file),
            colors: numOfColors,
            debug:  false,
            ignoreWarnings: false
        });

        return result;
    }

    getOftenOccuringColors(colorArray, limit){
        //Count colors
        colorMap = new Map[];
        for(var color of colorArray){
            if(colorMap.has(color.hex)){
                colorMap.set(color.hex, colorMap.get(color.hex)+1);
            }
            else{
                colorMap.set(color.hex, 1);
            }
        }

        //Return a new Array, ordered by count number
        return Array
            .from(colorMap)
            .sort((a, b) => {
              // a[0], b[0] is the key of the map
              return a[1] - b[1];
            })
            .slice(0, limit);
    }
}
