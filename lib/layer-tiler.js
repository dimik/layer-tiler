var Canvas = require('canvas'),
    Image = Canvas.Image,
    Vow = require('vow'),
    util = require('util'),
    fs = require('fs');

var Tiler = module.exports = function (options) {
    this._source = new TileSource();
    this._options = this.getDefaults();
};

Tiler.prototype = {
    constructor: Tiler,
    openSource: function (url) {
        return this._source
            .open(url);
    },
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
            offset = [ bottomRight[0] - topLeft[0], bottomRight[1] - topLeft[1] ];

console.log(util.format('rendering tile: zoom=%s, x=%s, y=%s, pixelX=%s, pixelY=%s', zoom, x, y, x * tileSize, y * tileSize));
console.log(topLeft, bottomRight);

        return this._source
            .cropTo(new Tile(tileSize, tileSize), topLeft[0], topLeft[1], offset[0], offset[1])
            .save(
                this.getTileUrl(x, y, zoom),
                this._options.tileType
            );
    },
    resizeSourceAtZoom: function (zoom) {
        var promise = Vow.promise(),
            tilesSize = this.getTilesCountAtZoom(zoom) * this._options.tileSize;
    },
    _getMaxZoom: function () {
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
    render: function () {
        var options = this._options,
            minZoom = options.minZoom,
            maxZoom = options.maxZoom == 'auto'?
                this._getMaxZoom() : options.maxZoom,
            handlers = [];

console.log(util.format('in render: minzoom=%s, maxzoom=%s', minZoom, maxZoom));
/*
        for(var zoom = maxZoom; zoom >= minZoom; zoom--) {
console.log('zoom: ', zoom);
            handlers.push(
                this.renderTilesAtZoom.bind(this, zoom)
            );
        }
*/
            handlers.push(
                this.renderTilesAtZoom.bind(this, maxZoom)
            );

        return this._resolveAllHandlers(handlers);
    },
    getTilesCountAtZoom: function (zoom) {
        return Math.pow(2, zoom);
    },
    renderTilesAtZoom: function (zoom) {
        var tilesCount = this.getTilesCountAtZoom(zoom),
            handlers = [];

        // var p = this.resizeSourceAtZoom(zoom);
        var count = 3;

        for(var x = 0; x < tilesCount; x++) {
            for(var y = 0; y < tilesCount; y++) {
                if(this.isTileFound(x, y, zoom)) {
                    console.log(util.format('render: zoom=%s, x=%s, y=%s', zoom, x, y));
                    handlers.push(
                        this.renderTile.bind(this, x, y, zoom)
                    );
                }
            }
        }

        return this._resolveAllHandlers(handlers);
    },
    isTileFound: function (x, y, zoom) {
        var source = this._source,
            tileSize = this._options.tileSize,
            tilesCount = this.getTilesCountAtZoom(zoom),
            tilesCountByWidth = Math.ceil(source.getWidth() / tileSize / 2) * 2,
            tilesCountByHeight = Math.ceil(source.getHeight() / tileSize / 2) * 2,
            offsetX = (tilesCount - tilesCountByWidth) / 2,
            offsetY = (tilesCount - tilesCountByHeight) / 2,
            condition = (x >= offsetX && x < tilesCountByWidth + offsetX) &&
            (y >= offsetY && y < tilesCountByHeight + offsetY);

        console.log(x, y, zoom, condition);

        return condition;
    },
    fromGlobalPixels: function (globalPixelPoint, zoom) {
        var source = this._source,
            sourceWidth = source.getWidth(),
            sourceHeight = source.getHeight(),
            tileSize = this._options.tileSize,
            tilesCount = this.getTilesCountAtZoom(zoom),
            pixelsCount = tilesCount * tileSize,
            offset = [
                Math.ceil((pixelsCount - sourceWidth) / 2),
                Math.ceil((pixelsCount - sourceHeight) / 2)
            ];

        return [
            Math.min(
                Math.max(globalPixelPoint[0] - offset[0], 0),
                sourceWidth
            ),
            Math.min(
                Math.max(globalPixelPoint[1] - offset[1], 0),
                sourceHeight
            )
        ];
    },
    _resolveAllHandlers: function (handlers) {
        return Vow.allResolved(
            handlers.reduce(function (promises, current, index) {
                promises.push(
                    promises[index].then(current)
                );

                return promises;
            }, [ handlers[0]() ])
        );
    },
    getTileUrl: function (x, y, zoom) {
        return util.format('/Users/dmk/Work/layer-tiler/images/%s_%s-%s.%s', zoom, x, y, this._options.tileType);
    },
    getDefaults: function () {
        return {
            tileType: 'png',
            tileSize: 256,
            minZoom: 0,
            maxZoom: 'auto'
        };
    }
};

function Tile(w, h) {
    this._source = new Canvas(w, h);
}

Tile.prototype = {
    constructor: Tile,
    getContext: function () {
        return this._source.getContext('2d');
    },
    save: function (url, type) {
        var promise = Vow.promise(),
            out = fs.createWriteStream(url),
            stream = this._source['create' + type.toUpperCase() + 'Stream'](
                this.getDefaults()[type]
            );

        out.on('finish', function () {
            stream.removeAllListeners();
            out.removeAllListeners();
            promise.fulfill(1);
        });

        stream
            .on('data', function (chunk) {
                out.write(chunk);
            })
            .on('end', function () {
                out.end();
            });

        return promise;
    },
    getSource: function () {
        return this._source;
    },
    getWidth: function () {
        return this._source.width;
    },
    getHeight: function () {
        return this._source.height;
    },
    getDefaults: function () {
        return {
            jpg: {
                bufsize : 2048,
                quality : 80
            },
            png: {}
        };
    }
};

function TileSource() {
    this._source = new Image();
}

TileSource.prototype = {
    constructor: TileSource,
    open: function (url) {
        var source = this._source,
            promise = Vow.promise();

        source.onload = function () {
console.log(arguments, this.getSize(), this.getWidth(), this.getHeight());
            promise.fulfill(this);
        }.bind(this);

        source.onerror = function (err) {
            promise.reject(err);
        };

        source.src = url;

        return promise;
    },
    getSource: function () {
        return this._source;
    },
    getWidth: function () {
        return this._source.width;
    },
    getHeight: function () {
        return this._source.height;
    },
    getSize: function () {
        return [
            this._source.width,
            this._source.height
        ];
    },
    cropTo: function (tile, x, y, w, h) {
        tile.getContext()
            .drawImage(this._source, x, y, w, h, x? 0 : tile.getWidth() - w, y? 0 : tile.getHeight() - h, w, h);

        return tile;
    },
    resize: function (w, h) {
        var canvas = new Canvas(w, h),
            ctx = canvas.getContext('2d');

        // ctx.imageSmoothingEnabled = true;

        canvas.getContext('2d')
            .drawImage(this._source, 0, 0, w, h);

        this._source = canvas;
    }
};
