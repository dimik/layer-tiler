var Canvas = require('canvas'),
    Image = Canvas.Image,
    Vow = require('vow'),
    util = require('util'),
    fs = require('fs');

var Tiler = module.exports = function (options) {
    this._source = new TileSource();
    this._options = this.getDefaults();
    this._maxZoom = null;
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
    resizeSourceAtZoom: function (zoom) {
        var source = this._source,
            tilesSize = this.getTilesCountAtZoom(zoom) * this._options.tileSize,
            width = source.getWidth(), height = source.getHeight(),
            proportion = Math.max(width, height) / Math.min(width, height);

        if(source.getWidth() > source.getHeight()) {
            this._source
                .resize(tilesSize, Math.round(tilesSize / proportion));
        }
        else {
            this._source
                .resize(Math.round(tilesSize / proportion), tilesSize);
        }
    },
    getMaxZoom: function () {
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
            maxZoom = this._maxZoom = options.maxZoom === 'auto'?
                this.getMaxZoom() : options.maxZoom,
            handlers = [];

        for(var zoom = maxZoom; zoom >= minZoom; zoom--) {
            handlers.push(
                this.renderTilesAtZoom.bind(this, zoom)
            );
        }

        return this._resolveAllHandlers(handlers);
    },
    getTilesCountAtZoom: function (zoom) {
        return Math.pow(2, zoom);
    },
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
    isTileFound: function (x, y, zoom) {
        var source = this._source,
            tileSize = this._options.tileSize,
            tilesCount = this.getTilesCountAtZoom(zoom),
            tilesCountByWidth = Math.ceil(source.getWidth() / tileSize / 2) * 2,
            tilesCountByHeight = Math.ceil(source.getHeight() / tileSize / 2) * 2,
            offsetX = (tilesCount - tilesCountByWidth) / 2,
            offsetY = (tilesCount - tilesCountByHeight) / 2;

        return (x >= offsetX && x < tilesCountByWidth + offsetX) &&
            (y >= offsetY && y < tilesCountByHeight + offsetY);
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
            handlers.reduce(function (promises, handler, index) {
                promises.push(
                    promises[index].then(handler)
                );

                return promises;
            }, [ Vow.resolve() ])
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
            promise.fulfill();
        };

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
    cropTo: function (tile, sx, sy, sw, sh, tx, ty, tw, th) {
        tile.getContext()
            .drawImage(this._source, sx, sy, sw, sh, tx, ty, tw, th);

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

function PageRenderer(options) {
    this._options = options;
}

PageRenderer.prototype = {
    constructor: PageRenderer,
    render: function (data) {
    }
};

PageRenderer.TEMPLATE = '
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ru" lang="ru">
<head>
    <title>Пользовательский слой.</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>

    <link href="/bootstrap/css/bootstrap.css" rel="stylesheet">

    <script src="http://api-maps.yandex.ru/2.0/?load=package.standard&lang=ru-RU" type="text/javascript"></script>

    <script type="text/javascript">
        var options = {
                tileUrlTemplate: "./tiles/%z/tile-%x-%y.png",
                controls: {
                    typeControl: true,
                    miniMap: true,
                    toolBar: true,
                    scaleLine: true
                },
                scrollZoomEnabled: true,
                mapCenter: new YMaps.GeoPoint(-177.940063476563, 84.9204024523413),
                backgroundMapType: YMaps.MapType.NONE,
                mapZoom: 8,
                isTransparent: true,
                smoothZooming: false,
                layerKey: "my#layer",
                mapType: {
                    name: "Мой слой",
                    textColor: "#000000"
                },
                copyright: "",
                layerMinZoom: ${minZoom},
                layerMaxZoom: ${maxZoom}
            };

        ymaps.ready(function () {
            // Передаем его в конструктор класса TilerConverter и получаем ссылку на карту.
            var myMap = (new TilerConverter(options)).getMap();
        });
    </script>
    <style type="text/css">
        #YMapsID {
            width: 900px;
            height: 400px;
        }
    </style>
</head>
<body>
    <div class="hero-unit">
        <div class="container">
            <p>Пользовательский слой</p>
            <div id="YMapsID"></div>
        </div>
    </div>
</body>
</html>
';
