var ProjectionFactory = require('./factory');
var factory = new ProjectionFactory();

module.exports = {
  "Cartesian": function (options) {
    return factory.create('cartesian', options);
  },
  "wgs84Mercator": factory.create('wgs84Mercator'),
  "sphericalMercator": factory.create('sphericalMercator')
};
