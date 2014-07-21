var vow = require('vow'),
    inherit = require('inherit'),
    fs = require('fs');

module.exports = inherit({
    __constructor: function () {
        this._data = null;
    },
    build: function (data) {
        this._data = this.__self.tmpl.replace(/\$\{([^}]+)\}/g, function (match, name) {
            var value = data[name];

            return typeof value != 'undefined'? value : '';
        });

        return this;
    },
    save: function (url) {
        var defer = vow.defer();

        fs.writeFile(url, this._data, function (err) {
            if(err) {
                defer.reject(err);
            }
            else {
                defer.resolve(true);
            }
        });

        return defer.promise();
    }
}, {
    tmpl: [
        '<!DOCTYPE html>',
        '<html xmlns="http://www.w3.org/1999/xhtml">',
        '<head>',
        '    <title>Пользователькая карта.</title>',
        '    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>',

        '    <style type="text/css">',
        '        html, body, #map {',
        '            padding: 0;',
        '            margin: 0;',
        '            width: 100%;',
        '            height: 100%;',
        '        }',
        '    </style>',

        '    <script type="text/javascript" src="http://api-maps.yandex.ru/2.1/?lang=ru-RU"></script>',
        '    <script type="text/javascript">',
        '        ymaps.ready(function () {',
        '            var layerName = "user#layer";',
        '            var zoomRange = [${minZoom}, ${maxZoom}];',
        '            var Layer = function () {',
        '                var layer = new ymaps.Layer("${tileUrlTemplate}.${tileType}", { zIndex: 10000,  tileTransparent: true });',

        '                layer.getZoomRange = function () {',
        '                    return ymaps.vow.resolve(zoomRange);',
        '                };',

        '                return layer;',
        '            };',
        '            ymaps.layer.storage.add(layerName, Layer);',
        // '            var mapType = new ymaps.MapType(layerName, [layerName]);',
        // '            ymaps.mapType.storage.add(layerName, mapType);',
        '            var mapType = ymaps.mapType.storage.get("yandex#map");',
        '            var layers = mapType.getLayers();',
        '            layers.push(layerName);',
        '            var map = new ymaps.Map("map", {',
        '                center: [0, 0],',
        '                zoom: ${minZoom},',
        // '                type: layerName,',
        '                controls: ["zoomControl"]',
        '            }, {',
        // '                projection: new ymaps.projection.Cartesian([[-1, -1], [1, 1]], [false, false])',
        '                projection: ymaps.projection.${projection}',
        '            });',
        '        });',
        '    </script>',
        '</head>',
        '<body>',
        '    <div id="map"></div>',
        '</body>',
        '</html>'
    ].join('\n')
});
