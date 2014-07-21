var util = require('../util');
var CoordSystem = require('../coord-system/cartesian');

/**
 * @fileOverview
 * Декартова проекция на заданную область.
 */
module.exports = function (options) {
  var bounds = options.bounds;
  var scale = options.scale;
  var cycled = options.cycled? options.cycled : [false, false];
  var coordSystem = new CoordSystem(scale);
  var inverseOrder = options && options.coordOrder == 'latlong';

  // в bounds будем хранить прямой порядок координат [x, y]
  if(inverseOrder) {
    bounds = [
      [bounds[0][1], bounds[0][0]],
      [bounds[1][1], bounds[1][0]]
    ];
  }

  var xRange = bounds[1][0] - bounds[0][0];
  var yRange = bounds[1][1] - bounds[0][1];

  this.toGlobalPixels = function (point, zoom) {
    var worldSize = Math.pow(2, zoom + 8);
    var x = point[inverseOrder ? 1 : 0];
    var y = point[inverseOrder ? 0 : 1];

    return [
      ((x - bounds[0][0]) / xRange) * worldSize,
      ((bounds[1][1] - y) / yRange) * worldSize
    ];
  };

  this.fromGlobalPixels = function (point, zoom) {
    var worldSize = Math.pow(2, zoom + 8);
    var geoPoint = [
      point[0] * xRange / worldSize + bounds[0][0],
      bounds[1][1] - yRange * point[1] / worldSize
    ];

    geoPoint = getFixedPoint(geoPoint);

    return inverseOrder ? [geoPoint[1], geoPoint[0]] : geoPoint;
  };

  this.isCycled = function () {
    return cycled;
  };

  this.getCoordSystem = function () {
    return coordSystem;
  };

  function getFixedPoint(geoPoint) {
    return [
      cycled[0] ? util.math.cycleRestrict(geoPoint[0], bounds[0][0], bounds[1][0]) : geoPoint[0],
      cycled[1] ? util.math.cycleRestrict(geoPoint[1], bounds[0][1], bounds[1][1]) : geoPoint[1]
    ];
  }
}
