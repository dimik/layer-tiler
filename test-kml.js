var LayerTiler = require('./lib/layer-tiler');

var libxml = require('libxmljs');
var fs = require('fs');
var path = require('path');

var folder = 'accenture';
var kml = fs.readFileSync(path.join(folder, 'doc.kml'));
var doc = libxml.parseXml(kml.toString());
var ns = doc.root().namespace().href();

// var overlays = doc.find('//xmlns:GroundOverlay', ns)
var overlays = doc.find("//xmlns:GroundOverlay[xmlns:Icon/xmlns:href='block-L5-1-1.jpg'][1]", ns)

overlays.forEach(function (overlay) {
    var icon = overlay.get('xmlns:Icon/xmlns:href', ns).text();
    var llb = overlay.get('xmlns:LatLonBox', ns);
    var ne = [
        parseFloat(llb.get('xmlns:north', ns).text()),
        parseFloat(llb.get('xmlns:east', ns).text())
    ];
    var sw = [
        parseFloat(llb.get('xmlns:south', ns).text()),
        parseFloat(llb.get('xmlns:west', ns).text())
    ];
    var bounds = [ sw, ne ];

    console.log('file: ', path.join(folder, icon), '\nbounds: ', bounds);

    var start = new Date;
    var tiler = new LayerTiler({
        maxZoom: 19,
        bounds: bounds
    });

    tiler.openSource(path.join(folder, icon))
        .then(function () {
            return tiler.render();
        })
        .done(function () {
            console.log('Rendered in %ds', Math.ceil((new Date - start) / 1000));
        }, function (err) {
            console.log('error', err);
        }, function (progress) {
            console.log(progress);
        });
});
