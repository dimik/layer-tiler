var Tiler = require('./lib/layer-tiler.js'),
    destination = __dirname + '/images',
    start = new Date;

var tiler = new Tiler({ output: destination });

// tiler.openSource(destination + '/cosmo_map_final.png')
tiler.openSource(destination + '/big.jpg')
    .then(function () {
        tiler.render()
            .then(function () {
                console.log('Rendered in %ds', Math.ceil((new Date - start) / 1000));
            });
    });
