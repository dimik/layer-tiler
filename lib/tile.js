var Canvas = require('canvas'),
    fs = require('fs'),
    inherit = require('inherit'),
    vow = require('vow'),
    ImageSource = require('./image-source');

/**
 * @class
 * @name Tile
 * @augments ImageSource
 * @param {Number} width Tile width.
 * @param {Number} height Tile height.
 */
var Tile = module.exports = inherit(ImageSource, /** @lends Tile prototype. */ {
    /**
     * @constructor
     */
    __constructor: function (size) {
        this._source = new Canvas(size, size);
    },
    /**
     * Write canvas source to the image file.
     * @borrows ImageSource.save
     * @function
     * @name Tile.save
     * @param {String} url Path to the image.
     * @param {String} [type="png"] Type of the image "png" or "jpg".
     * @returns {Vow} Promise A+.
     */
    save: function (url, type) {
        if(type == null || type == 'png') {
            return this.__base(url, type);
        }

        /**
         * If type is "jpg".
         */
        var defer = vow.defer(),
            out = fs.createWriteStream(url),
            stream = this._source.createJPGStream(
                this.getDefaults()
            );

        out.once('finish', defer.resolve);

        stream.pipe(out);

        return defer.promise();
    },
    /**
     * Default options.
     * @function
     * @name Tile.getDefaults
     * @returns {Object} Options.
     */
    getDefaults: function () {
        return {
            bufsize: 2048,
            quality: 80,
            progressive: false
        };
    }
});
