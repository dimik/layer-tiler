var util = require('../util');

/**
 * @class Класс, описывающий геометрию декартовой плоскости.
 * Используется как координатная система по умолчанию при построении
 * геодезических линий в нестандартных проекциях.
 * @name coordSystem.cartesian
 * @param {Number|Number[]} [scale=1] Масштаб одного деления на оси. Может быть числом или парой чисел для каждой из осей.
 * @augments ICoordSystem
 * @static
 */
module.exports = function (scale) {
  scale = scale || [1, 1];
  scale = typeof scale == 'number' ? [scale, scale] : scale;

  this.solveDirectProblem = function (startPoint, direction, distance) {
    direction = normalizeVector(direction);

    var dx = direction[0] * distance / scale[0];
    var dy = direction[1] * distance / scale[1];

    return {
      startPoint: startPoint,
      startDirection: direction,
      endPoint: [startPoint[0] + dx, startPoint[1] + dy],
      endDirection: direction,
      distance: distance,
      pathFunction: function (n) {
        return {
          point: [startPoint[0] + dx * n, startPoint[1] + dy * n],
          direction: direction
        };
      }
    };
  };

  this.solveInverseProblem = function (startPoint, endPoint) {
    var dx = endPoint[0] - startPoint[0];
    var dy = endPoint[1] - startPoint[1];
    var unitDistance = getUnitDistance(startPoint, endPoint);
    var direction = [dx / unitDistance, dy / unitDistance];

    return {
      startPoint: startPoint,
      startDirection: direction,
      endPoint: endPoint,
      endDirection: direction,
      distance: this.getDistance(startPoint, endPoint),
      pathFunction: function (n) {
        return {
          point: [startPoint[0] + dx * n, startPoint[1] + dy * n],
          direction: direction
        };
      }
    };
  };

  this.getDistance = function (point1, point2) {
    return Math.sqrt(
      Math.pow((point2[0] - point1[0]) * scale[0], 2) +
      Math.pow((point2[1] - point1[1]) * scale[1], 2)
    );
  };

  function getUnitDistance(point1, point2) {
    return Math.sqrt(Math.pow(point2[0] - point1[0], 2) + Math.pow(point2[1] - point1[1], 2));
  }

  function normalizeVector (vec) {
    var vecLen = Math.sqrt(Math.pow(vec[0], 2) + Math.pow(vec[1], 2));

    return [vec[0] / vecLen, vec[1] / vecLen];
  }
}
