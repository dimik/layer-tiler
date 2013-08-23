var Tiler = require('./lib/layer-tiler.js'),
    destination = __dirname + '/images';

var tiler = new Tiler({ output: destination });

tiler.openSource(destination + '/big.jpg')
    .then(function () {
        tiler.render();
    });
