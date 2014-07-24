var vow = require('vow'),
    inherit = require('inherit'),
    util = require('util'),
    ymUtils = require('./util'),
    fs = require('fs'),
    path = require('path'),
    TileSource = require('./tile-source'),
    ProjectionFactory = require('./projection/factory'),
    PageRenderer = require('./page-renderer');

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
        this._options = ymUtils.extend({}, this.getDefaults(), options);
        this._createProjection();
        this._source = new TileSource(this._options);
        this._maxZoom = null;
        this._page = new PageRenderer();
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

        handlers.push(function () {
            return this._page
                .build(ymUtils.extend({}, options, { center: this._getCenter() }))
                .save(path.resolve(path.join(options.output, 'index.html')));
        }.bind(this));

        return this._resolveAllHandlers(handlers);
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
            tilesBounds = this.getTilesBounds(zoom),
            x1 = tilesBounds[0][0], x2 = tilesBounds[1][0],
            y1 = tilesBounds[0][1], y2 = tilesBounds[1][1],
            handlers = [];

        // console.log('zoom: ', zoom, 'tilesBounds: ', tilesBounds, 'tilesCount: ', tilesCount);

        for(var x = x1; x1 <= x2? x <= x2 : x <= x2 || x >= x1; x++) {
            x === tilesCount && (x = 0);
            for(var y = y1; y1 <= y2? y <= y2 : y <= y2 || y >= y1; y++) {
                y === tilesCount && (y = 0);
                handlers.push(
                    this.renderTile.bind(this, x, y, zoom)
                );
            }
        }

        return this._resolveAllHandlers(handlers);
    },
    _createProjection: function () {
        var options = this._options,
            factory = new ProjectionFactory({
                coordOrder: options.coordOrder
            });

        this._projection = factory.create(options.projection);
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
        var defer = vow.defer();

        fs.mkdir(path.resolve(path.join(this._options.output, name)), function (err) {
            // defer.notify(util.format('creating folder: %s', name));
            if(err) {
                defer.reject(err);
            }
            else {
                defer.resolve();
            }
        });

        return defer.promise();
    },
    renderTile: function (x, y, zoom) {
        var defer = vow.defer();

        this._source.getTile(x, y, zoom)
            .save(
                this.getTileUrl(x, y, zoom),
                this._options.tileType
            )
            .done(function (res) {
                // defer.notify(util.format('rendering tile: zoom=%s, x=%s, y=%s', zoom, x, y));
                defer.resolve(res);
            }, function (err) {
                defer.reject(err);
            });

        return defer.promise();
    },
    getTilesBounds: function (zoom) {
        var options = this._options,
            projection = this._projection,
            tileSize = options.tileSize,
            pixelBounds = options.bounds.map(function (point) {
                return projection.toGlobalPixels(point, zoom);
            });

        return [
            [
                Math.floor(pixelBounds[0][0] / tileSize),
                Math.floor(pixelBounds[1][1] / tileSize),
            ], [
                Math.floor(pixelBounds[1][0] / tileSize),
                Math.floor(pixelBounds[0][1] / tileSize),
            ]
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
        return vow.all(
            handlers.reduce(function (promises, handler, index) {
                promises.push(promises[index].then(handler));

                return promises;
            }, [ vow.resolve() ])
        );
    },
    _getCenter: function () {
        var bounds = this._options.bounds;

        return [
            (bounds[0][0] + bounds[1][0]) / 2,
            (bounds[0][1] + bounds[1][1]) / 2
        ];
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

        return path.join(options.output, options.tileUrlTemplate)
            .replace('%z', zoom)
            .replace('%x', x)
            .replace('%y', y)
            .concat('.', options.tileType);
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
            projection: 'wgs84Mercator',
            coordOrder: 'latlong',
            tileUrlTemplate: 'tiles/%z/%x-%y',
            tileSize: 256,
            tileType: 'png',
            minZoom: 0,
            maxZoom: 'auto'
        };
    }
});
