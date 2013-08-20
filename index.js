var Tiler = require(__dirname + '/canvas-tiler.js'),
    destination = __dirname + '/images';

var tiler = new Tiler();

tiler.openSource(destination + '/big.jpg')
    .then(function () {
        tiler.render();
    });

/*
var Canvas = require('canvas'),
    Image = Canvas.Image,
    Vow = require('vow'),
    util = require('util'),
    fs = require('fs');

function Tile(w, h) {
    this._canvas = new Canvas(w, h);
}

Tile.prototype = {
    constructor: Tile,
    getContext: function () {
        return this._canvas.getContext('2d');
    },
    save: function (url, type) {
        var promise = Vow.promise(),
            out = fs.createWriteStream(url),
            stream = this._canvas['create' + type.toUpperCase() + 'Stream'](
                //this.getDefaults()[type]
            );

        stream
            .on('data', function (chunk) {
                out.write(chunk);
            })
            .on('end', function () {
                promise.fulfill(1);
            });

        return promise;
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
    crop: function (x, y, w, h) {
        var tile = new Tile(w, h);
console.log('cropping tile: x=', x, ' y=', y, ' w=', w, ' h=', h);
        tile.getContext()
            .drawImage(this._source, x, y, w, h, 0, 0, w, h);

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





var destination = __dirname + '/images';
var source = new TileSource();

source.open(destination + '/big.jpg')
    .then(function () {
    [1,2,3].forEach(function (i) {
        source.crop(0, 0, 256, 256)
            .save(
                destination + '/aaa' + i + '.png',
                'png'
            )
    });
    });
*/
