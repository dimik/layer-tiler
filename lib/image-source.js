var Canvas = require('canvas'),
    Vow = require('vow'),
    fs = require('fs'),
    inherit = require('inherit');

/**
 * Base Class for Tile and TileSource.
 * @class
 * @function
 * @name ImageSource
 */
var ImageSource = module.exports = inherit(/** @lends ImageSource prototype. */ {
    /**
     * @constructor
     */
    __constructor: function () {
        this._source = new Canvas.Image();
    },
    /**
     * Getter for Canvas source.
     * @function
     * @name ImageSource.getSource
     * @returns {Canvas} Source of the Image.
     */
    getSource: function () {
        return this._source;
    },
    /**
     * Getter for Canvas context.
     * @function
     * @name ImageSource.getContext
     * @returns {Object} Canvas context object.
     */
    getContext: function () {
        return this._source.getContext('2d');
    },
    /**
     * Getter for Canvas width.
     * @function
     * @name ImageSource.getWidth
     * @returns {Number} Canvas width.
     */
    getWidth: function () {
        return this._source.width;
    },
    /**
     * Getter for Canvas height.
     * @function
     * @name ImageSource.getHeight
     * @returns {Number} Canvas height.
     */
    getHeight: function () {
        return this._source.height;
    },
    /**
     * Open the image file.
     * @function
     * @name ImageSource.open
     * @param {String} url Path to the image file.
     * @returns {Vow} Promise A+
     */
    open: function (url) {
        var source = this._source,
            promise = Vow.promise();

        source.onload = function () {
            promise.fulfill();
        };

        source.onerror = function (err) {
            promise.reject(err);
        };

        source.src = url;

        return promise;
    },
    /**
     * Write canvas source to the image file.
     * @function
     * @name ImageSource.open
     * @param {String} url Path to the image file.
     * @returns {Vow} Promise A+
     */
    save: function (url) {
        var promise = Vow.promise();

        this._source.toBuffer(function (err, buf) {
            if(err) {
                promise.reject(err);
            }
            else {
                fs.writeFile(url, buf, function (err) {
                    if(err) {
                        promise.reject(err);
                    }
                    else {
                        promise.fulfill();
                    }
                });
            }
        });

        return promise;
    }
});
