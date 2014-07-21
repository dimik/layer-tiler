var util = require('../util');
var GeoToGlobalPixelsProjection = require('./geo-to-global-pixels');
var CartesianProjection = require('./cartesian');

var defaultOpts = {
  cartesian: { scale: 1 },
  wgs84Mercator: {},
  sphericalMercator: { e: 0 }
};

module.exports = function (globalOpts) {
  this.create = function (projection, opts) {
    var o = util.extend({}, defaultOpts[projection], globalOpts, opts);

    switch(projection) {
      case 'wgs84Mercator':
      case 'sphericalMercator':
        return new GeoToGlobalPixelsProjection(o);
      case 'cartesian':
        return new CartesianProjection(o);
      default:
        throw new TypeError('Unknown projection type');
    };
  };
};
