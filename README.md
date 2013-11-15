layer-tiler
===========

NodeJS image tiler for user layers creation.

Description
============

This class creates set of map layer tiles from high-resolution image.
using <a href="http://nodejs.org/">NodeJS</a> platform and <a href="https://github.com/learnboost/node-canvas">node-canvas</a>
It supports jpg and png image formats.

Example
------------

```javascript

var LayerTiler = require('layer-tiler'),
    destination = __dirname + '/tiles',
    source = __dirname + '/source',
    tiler = new LayerTiler({ output: destination }),
    start = new Date;

tiler.openSource(source + '/large-image.jpg')
    .then(function () {
        tiler.render()
            .then(function () {
                console.log('Rendered in %ds', Math.ceil((new Date - start) / 1000));
            });
    });

```
