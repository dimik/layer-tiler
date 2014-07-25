var Canvas = require('canvas'),
    inherit = require('inherit'),
    ImageSource = require('./image-source'),
    Tile = require('./tile'),
    ProjectionFactory = require('./projection/factory');

/**
 * @class
 * @name TileSource
 * @augments ImageSource
 */
var TileSource = module.exports = inherit(ImageSource, /** @lends TileSource prototype */ {
    /**
     * @constructor
     */
    __constructor: function (options) {
        this.__base.apply(this, arguments);
        this._options = options;
    },
    open: function () {
        var promise = this.__base.apply(this, arguments);

        return promise.then(function (res) {
            this._createProjection();

            return res;
        }, this);
    },
    _createProjection: function () {
        var options = this._options,
            factory = new ProjectionFactory({
                coordOrder: options.coordOrder
            });

        this._projection = factory.create(options.projection);
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
    },
    /**
     * Render one tile.
     * @function
     * @name TileSource.getTile
     * @param {Number} x Tile coordinate by X.
     * @param {Number} y Tile coordinate by Y.
     * @param {Number} zoom
     * @returns {Tile}
     */
    getTile: function (x, y, zoom) {
        var options = this._options,
            tileSize = options.tileSize,
            width = this.getWidth(),
            height = this.getHeight(),
            size = this.getSizeAtZoom(zoom),
            scale = [
                size[0] / width,
                size[1] / height
            ],
            offset = this.getOffset(x, y, zoom),
            tileX = offset[0] > 0? offset[0] : 0,
            tileY = offset[1] > 0? offset[1] : 0,
            tileW = Math.min(size[0], tileSize - tileX),
            tileH = Math.min(size[1], tileSize - tileY),
            sourceX = offset[0] > 0? 0 : Math.abs(offset[0]) / scale[0],
            sourceY = offset[1] > 0? 0 : Math.abs(offset[1]) / scale[1],
            sourceW = size[0] + tileX > tileSize? (tileSize - tileX) / scale[0] : width,
            sourceH = size[1] + tileY > tileSize? (tileSize - tileY) / scale[1] : height;

        // console.log('x: ', x, 'y: ', y, 'zoom: ', zoom, 'offset: ', offset, 'size: ', size, 'scale: ', scale, 'widht: ', width, 'height: ', height, 'tileX: ', tileX, 'tileY: ', tileY, 'tileW: ', tileW, 'tileH: ', tileH, 'sourceX: ', sourceX, 'sourceY: ', sourceY, 'sourceW: ', sourceW, 'sourceH: ', sourceH);

        return this.cropTo(
            new Tile(tileSize),
            Math.round(sourceX),
            Math.round(sourceY),
            Math.round(sourceW),
            Math.round(sourceH),
            Math.round(tileX),
            Math.round(tileY),
            Math.round(tileW),
            Math.round(tileH)
        );
    },
    getOffset: function (x, y, zoom) {
        var options = this._options,
            tileSize = options.tileSize,
            tileX = x * tileSize,
            tileY = y * tileSize,
            projection = this._projection,
            isCycled = projection.isCycled(),
            worldSize = this.getWorldSizeAtZoom(zoom),
            pixelBounds = this.getPixelBounds(zoom),
            offset = [
                pixelBounds[0][0] - tileX,
                pixelBounds[1][1] - tileY
            ];

        return [
            isCycled[0] && offset[0] > tileSize? -(worldSize - pixelBounds[0][0] + tileX) : offset[0],
            isCycled[1] && offset[1] > tileSize? -(worldSize - pixelBounds[1][1] + tileY) : offset[1]
        ];
    },
    getPixelBounds: function (zoom) {
        var options = this._options,
            projection = this._projection;

        return options.bounds.map(function (point) {
            return projection.toGlobalPixels(point, zoom);
        });
    },
    getSizeAtZoom: function (zoom) {
        var options = this._options,
            projection = this._projection,
            isCycled = projection.isCycled(),
            bounds = options.bounds,
            source = this._source,
            worldSize = this.getWorldSizeAtZoom(zoom),
            topLeft = projection.toGlobalPixels([bounds[1][0], bounds[0][1]], zoom),
            bottomRight = projection.toGlobalPixels([bounds[0][0], bounds[1][1]], zoom);

        return [
            isCycled[0] && topLeft[0] > bottomRight[0]?
                worldSize - topLeft[0] + bottomRight[0] : bottomRight[0] - topLeft[0],
            isCycled[1] && topLeft[1] > bottomRight[1]?
                worldSize - topLeft[1] + bottomRight[1] : bottomRight[1] - topLeft[1]
        ];
    },
    getWorldSizeAtZoom: function (zoom) {
        return Math.pow(2, zoom + 8);
    }
});
