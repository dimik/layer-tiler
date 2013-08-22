var Canvas = require('canvas'),
    inherit = require('inherit'),
    Vow = require('vow'),
    ImageSource = require('./image-source');

/**
 * @class
 * @name TileSource
 * @augments ImageSource
 */
var TileSource = module.exports = inherit(ImageSource, /** @lends TileSource prototype */ {
    /**
     * @constructor
     */
    __constructor: function () {
        this.__base.apply(this, arguments);
    },
    cropTo: function (tile, sx, sy, sw, sh, tx, ty, tw, th) {
        tile.getContext()
            .drawImage(this._source, sx, sy, sw, sh, tx, ty, tw, th);

        return tile;
    },
    resize: function (width, height) {
        var canvas = new Canvas(width, height),
            ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(this._source, 0, 0, width, height);

        this._source = canvas;
    }
});
