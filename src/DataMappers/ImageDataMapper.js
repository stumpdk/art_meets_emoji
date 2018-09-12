'use strict'

const getPixels = require('get-pixels');
const getRgbaPalette = require('get-rgba-palette');
const chroma = require('chroma-js');
/**
 * This class extracts data from images using ImageMagick as its driver
 */

class ImageDataMapper {
    constructor(){
    }

    getProminentColors(filename, numOfColors){
      return new Promise(function(fullfill, reject){
        console.log(filename);
        getPixels(filename, null, function (err, pixels) {
          if (err) return reject(err);
          const palette = getRgbaPalette(pixels.data, numOfColors).map(function (rgba) {
            return chroma(rgba)
          })

          fullfill(palette);
        })
      });
    }

    getFileFromUrl(fileUrl){
      return new Promise(function(fullfill, reject){
        rp.get(fileUrl).then(function (data) {
            //if (!error && response.statusCode == 200) {
                fullfill(data);
              //  fs.writeFileSync('d:/tmp.jpg', image, function(){
              //    getColors(fs.readFileSync('d:/tmp.jpg')).then(colors => {

              //  });
            /*}
            else{
              reject(null);
            }*/
        });
      });
    }

    getPixels(fileUrl){
      return new Promise(function(fullfill, reject){
        getPixels(fileUrl, function(err, pixels) {
          if(err) {
            console.log("Bad image path");
            console.warn(err);
            reject();
            return;
          }
          console.log("got pixels", pixels.shape.slice())
          let colors = '';
          for(let i = 0; i < pixels.shape[0]; i++){
            for(let j = 0; j< pixels.shape[1]; j++){
              colors = colors + ' ' + chroma(pixels.get(i,j,0),pixels.get(i,j,1),pixels.get(i,j,2)).hex();
            }
          }

          fullfill(colors);
          return;
          })
      });
    }

    getColorInfo(fileName, numOfColors){
      return new Promise(function(fullfill, reject){
          if(fileName){
            //console.log(imageData);
            getColors(fileName, numOfColors)
            .then(colors => {
              fullfill(colors);
            })
            .catch(err => { console.log('could not get colors',err); reject(null); });
          }
          else{
            console.log('no data given', fileName);
            reject(null);
          }
      }
    );

    /*  imagecolors.extract(file, numOfColors, function(err, colors){
      if (!err){
          console.log('EXTRACTED');
          console.log(colors);
          console.log();
          colorsIn=colors;
      }
      else{
        console.log(err);
      }
      });
      /*  let result = this.imagemagick.quantize({
            srcData: this.getDataFromFile(file),
            colors: numOfColors,
            debug:  false,
            ignoreWarnings: false
        });

        return result;*/
    }

    getOftenOccuringColors(colorArray, limit){
        //Count colors
        let colorMap = new Map();
        for(let color of colorArray){
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

module.exports = ImageDataMapper;
