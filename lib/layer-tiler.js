var Vow = require('vow'),
    inherit = require('inherit'),
    util = require('util'),
    fs = require('fs'),
    path = require('path'),
    Tile = require('./tile'),
    TileSource = require('./tile-source');

/**
 * User-Map-Layer Tiler Class.
 * Split source image by tiles.
 * @class
 * @name LayerTiler
 */
var LayerTiler = module.exports = inherit(/** @lends LayerTiler prototype. */ {
    /**
     * @constructor
     * @param {Object} options LayerTiler options.
     */
    __constructor: function (options) {
        this._source = new TileSource();
        this._options = this._extend({}, this.getDefaults(), options);
        this._maxZoom = null;
    },
    /**
     * Open source image.
     * @function
     * @name LayerTiler.openSource
     * @param {String} url Path to the source image.
     * @returns {Vow} Promise A+.
     */
    openSource: function (url) {
        return this._source
            .open(url);
    },
    /**
     * Render tiles from source image.
     * @function
     * @name LayerTiler.render
     * @returns {Vow} Promise A+.
     */
    render: function () {
        var options = this._options,
            minZoom = options.minZoom,
            maxZoom = this._maxZoom = options.maxZoom === 'auto'?
                this.getZoomBySource() : options.maxZoom,
            handlers = [
                this._createFolder.bind(this, 'tiles')
            ];

        for(var zoom = maxZoom; zoom >= minZoom; zoom--) {
            handlers.push(
                this._createFolder.bind(this, path.join('tiles', zoom.toString(10))),
                this.renderTilesAtZoom.bind(this, zoom)
            );
        }

        return this._resolveAllHandlers(handlers);
    },
    /**
     * Render one tile.
     * @function
     * @name LayerTiler.renderTile
     * @param {Number} x Tile coordinate by X.
     * @param {Number} y Tile coordinate by Y.
     * @param {Number} zoom
     * @returns {Vow} Promise A+.
     */
    renderTile: function (x, y, zoom) {
        var tileSize = this._options.tileSize,
            globalPixelPoint = [ x * tileSize, y * tileSize ],
            topLeft = this.fromGlobalPixels(
                globalPixelPoint,
                zoom
            ),
            bottomRight = this.fromGlobalPixels(
                [ globalPixelPoint[0] + tileSize, globalPixelPoint[1] + tileSize ],
                zoom
            ),
            offset = [ bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1] ],
            tileOffset = [
                topLeft[0] === 0? tileSize - offset[0] : 0,
                topLeft[1] === 0? tileSize - offset[1] : 0
            ];

        console.log(util.format('rendering tile: zoom=%s, x=%s, y=%s', zoom, x, y));

        if(zoom === 0) {
            tileOffset = [
                Math.round((tileSize - offset[0]) / 2),
                Math.round((tileSize - offset[1]) / 2)
            ];
        }

        return this._source
            .cropTo(
                new Tile(tileSize, tileSize),
                topLeft[0],
                topLeft[1],
                offset[0],
                offset[1],
                tileOffset[0],
                tileOffset[1],
                offset[0],
                offset[1]
            )
            .save(
                this.getTileUrl(x, y, zoom),
                this._options.tileType
            );
    },
    /**
     * @function
     * @name LayerTiler.resizeSourceAtZoom
     * @param {Number} zoom
     */
    resizeSourceAtZoom: function (zoom) {
        var source = this._source,
            tileSize = this._options.tileSize,
            tilesSize = this.getTilesCountAtZoom(zoom) * tileSize,
            curZoom = this.getZoomBySource(),
            curTilesSize = this.getTilesCountAtZoom(curZoom) * tileSize,
            coef = Math.pow(2, curZoom - zoom),
            width = source.getWidth(), height = source.getHeight(),
            curLongestSideSize = Math.max(width, height),
            curOffset = curTilesSize - curLongestSideSize,
            offset = Math.round(curOffset / coef),
            longestSideSize = tilesSize - offset,
            proportion = curLongestSideSize / Math.min(width, height);

        if(source.getWidth() > source.getHeight()) {
            this._source
                .resize(longestSideSize, Math.round(longestSideSize / proportion));
        }
        else {
            this._source
                .resize(Math.round(longestSideSize / proportion), longestSideSize);
        }
    },
    /**
     * Calculate zoom value by source size.
     * @function
     * @name LayerTiler.getZoomBySource
     * @returns {Number} Zoom value.
     */
    getZoomBySource: function () {
        var source = this._source,
            tileSize = this._options.tileSize,
            log2 = function (n) {
                return Math.log(n) / Math.log(2);
            },
            tilesCount = Math.ceil(
                Math.max(
                    Math.ceil(source.getWidth() / tileSize),
                    Math.ceil(source.getHeight() / tileSize)
                )
            );

        return Math.ceil(log2(tilesCount));
    },
    /**
     * Calculate number of tiles at the current zoom.
     * @name LayerTiler.getTilesCountAtZoom
     * @param {Number} zoom
     * @returns {Number} Tiles count at zoom.
     */
    getTilesCountAtZoom: function (zoom) {
        return Math.pow(2, zoom);
    },
    /**
     * @function
     * @name LayerTiler.renderTilesAtZoom
     * @param {Number} zoom
     * @returns {Vow} Promise A+.
     */
    renderTilesAtZoom: function (zoom) {
        var tilesCount = this.getTilesCountAtZoom(zoom),
            handlers = [];

        if(zoom < this._maxZoom) {
            this.resizeSourceAtZoom(zoom);
        }

        for(var x = 0; x < tilesCount; x++) {
            for(var y = 0; y < tilesCount; y++) {
                if(this.isTileFound(x, y, zoom)) {
                    handlers.push(
                        this.renderTile.bind(this, x, y, zoom)
                    );
                }
            }
        }

        return this._resolveAllHandlers(handlers);
    },
    /**
     * Folders creation helper.
     * @function
     * @private
     * @name LayerTiler._createFolder
     * @param {String} name Folder path and name.
     * @returns {Vow} Promise A+.
     */
    _createFolder: function (name) {
        var defer = new Vow.Deferred();

        fs.mkdir(path.resolve(path.join(this._options.output, name)), function (err) {
            if(err) {
                defer.reject(err);
            }
            else {
                defer.resolve();
            }
        });

        return defer.promise();
    },
    /**
     * Check if we need to render this tile.
     * @function
     * @name LayerTiler.isTileFound
     * @param {Number} x Tile coordinate by X.
     * @param {Number} y Tile coordinate by Y.
     * @param {Number} zoom
     * @returns {Boolean}
     */
    isTileFound: function (x, y, zoom) {
        var source = this._source,
            tileSize = this._options.tileSize,
            tilesCount = this.getTilesCountAtZoom(zoom),
            tilesCountByWidth = Math.ceil(source.getWidth() / tileSize / 2) * 2,
            tilesCountByHeight = Math.ceil(source.getHeight() / tileSize / 2) * 2,
            offset = [
                (tilesCount - tilesCountByWidth) / 2,
                (tilesCount - tilesCountByHeight) / 2
            ];

        return (x >= offset[0] && x < tilesCountByWidth + offset[0]) &&
            (y >= offset[1] && y < tilesCountByHeight + offset[1]);
    },
    /**
     * Get source point coordinates by global tile coordinates at current zoom.
     * @function
     * @name LayerTiler.fromGlobalPixels
     * @param {Number[]} globalPixelPoint Global pixel coordinates.
     * @param {Number} zoom
     * @returns {Number[]} Coordinates local to source image.
     */
    fromGlobalPixels: function (globalPixelPoint, zoom) {
        var source = this._source,
            tileSize = this._options.tileSize,
            tilesCount = this.getTilesCountAtZoom(zoom),
            pixelsCount = tilesCount * tileSize,
            offset = [
                Math.ceil((pixelsCount - source.getWidth()) / 2),
                Math.ceil((pixelsCount - source.getHeight()) / 2)
            ];

        return [
            Math.min(
                Math.max(globalPixelPoint[0] - offset[0], 0),
                source.getWidth()
            ),
            Math.min(
                Math.max(globalPixelPoint[1] - offset[1], 0),
                source.getHeight()
            )
        ];
    },
    /**
     * Process handlers in sequence.
     * @function
     * @private
     * @name LayerTiler._resolveAllHandlers
     * @param {Array} handlers List of the handlers.
     * @returns {Vow} Promise A+
     */
    _resolveAllHandlers: function (handlers) {
        return Vow.allResolved(
            handlers.reduce(function (promises, handler, index) {
                promises.push(
                    promises[index].then(handler)
                );

                return promises;
            }, [ Vow.resolve() ])
        );
    },
    /**
     * @function
     * @name LayerTiler.getTileUrl
     * @param {Number} x Tile coordinate by X.
     * @param {Number} y Tile coordinate by Y.
     * @param {Number} zoom
     * @return {String} Tile path and name.
     */
    getTileUrl: function (x, y, zoom) {
        var options = this._options;

        return util.format(path.join(options.output, options.tileUrlTemplate), zoom, x, y, options.tileType);
    },
    /**
     * Extends target object with properties of one or more source objects.
     * @function
     * @private
     * @name LayerTiler._extend
     * @param {Object} target
     * @param {Object} source
     * @returns {Object} Aggregates all own enumerable properties of the source objects.
     */
    _extend: function (target, source) {
        var slice = Array.prototype.slice,
            hasOwnProperty = Object.prototype.hasOwnProperty;

        slice.call(arguments, 1).forEach(function (o) {
            for(var key in o) {
                hasOwnProperty.call(o, key) && (target[key] = o[key]);
            }
        });

        return target;
    },
    /**
     * Default options.
     * @function
     * @name LayerTiler.getDefaults
     * @returns {Object} Options.
     */
    getDefaults: function () {
        return {
            output: process.cwd(),
            tileUrlTemplate: 'tiles/%s/%s-%s.%s',
            tileSize: 256,
            tileType: 'png',
            minZoom: 0,
            maxZoom: 'auto'
        };
    }
});
