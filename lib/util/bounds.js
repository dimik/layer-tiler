var utilBounds = module.exports = {
    /**
     * @ignore
     * @static
     * @name util.bounds.contains
     * Определяет содержат ли границы точку или полностью другие границы.
     * @param {Number[][]} outer Внешние границы.
     * @param {Number[][]|Number[]} inner Проверяемая точка или границы.
     * @param {IProjection} [projection] Проекция.
     * Параметр необходим, если данные задаются в координатной системе проекции.
     * @returns {Boolean}
     */
    contains: function (outer, inner, projection) {
        if (typeof inner[0] == "number") {
            return utilBounds._containsPoint(outer, inner, projection);
        } else {
            var pixelLowerCorner, pixelUpperCorner;
            if (projection) {
                pixelLowerCorner = projection.toGlobalPixels(inner[0], 0);
                pixelUpperCorner = projection.toGlobalPixels(inner[1], 0);
                outer = utilBounds.toGlobalPixelBounds(outer, projection, 0);
            } else {
                pixelLowerCorner = inner[0];
                pixelUpperCorner = inner[1];
            }
            return utilBounds._containsPoint(outer, pixelLowerCorner) && utilBounds._containsPoint(outer, pixelUpperCorner);
        }
    },
    /**
     * @ignore
     * @static
     * @name util.bounds.fromGlobalPixelBounds
     * Производит перевод границ из пиксельных координат в геокоординаты с учетом масштаба.
     * @param {Number[][]} pixelBounds Исходные границы.
     * @param {IProjection} projection Проекция, которая будет использоваться для вычисления геокоординат.
     * @param {Number} zoom Масштаб.
     * @returns {Number[][]} Вычисленные границы в геокоординатах.
     */
    fromGlobalPixelBounds: function (pixelBounds, projection, zoom) {
        var worldSize = Math.pow(2, zoom + 8),
            projectionCycled = projection.isCycled(),
            moreThanWorld = [
                projectionCycled[0] && Math.abs(pixelBounds[1][0] - pixelBounds[0][0]) >= worldSize,
                projectionCycled[1] && Math.abs(pixelBounds[1][1] - pixelBounds[0][1]) >= worldSize
            ],
            lowerCorner = [
                moreThanWorld[0] ?
                    0.5 * (pixelBounds[0][0] + pixelBounds[1][0]) - 0.5 * worldSize + 1e-10 :
                    Math.min(pixelBounds[0][0], pixelBounds[1][0]),
                moreThanWorld[1] ?
                    0.5 * (pixelBounds[0][1] + pixelBounds[1][1]) - 0.5 * worldSize + 1e-10 :
                    Math.min(pixelBounds[0][1], pixelBounds[1][1])
            ],
            upperCorner = [
                moreThanWorld[0] ?
                    0.5 * (pixelBounds[0][0] + pixelBounds[1][0]) + 0.5 * worldSize - 1e-10 :
                    Math.max(pixelBounds[0][0], pixelBounds[1][0]),
                moreThanWorld[1] ?
                    0.5 * (pixelBounds[0][1] + pixelBounds[1][1]) + 0.5 * worldSize - 1e-10 :
                    Math.max(pixelBounds[0][1], pixelBounds[1][1])
            ],
            result = [
                projection.fromGlobalPixels(lowerCorner, zoom),
                projection.fromGlobalPixels(upperCorner, zoom)
            ];
        // Для не зацикленых осей устанавливаем координаты так, чтобы координаты первой точки границы были меньше.
        for (var i = 0, l = projectionCycled.length; i < l; i++) {
            if (!projectionCycled[i]) {
                var index = inverseOrder ? l - 1 - i : i,
                    lowCoord = result[0][index],
                    upCoord = result[1][index];
                result[0][index] = Math.min(lowCoord, upCoord);
                result[1][index] = Math.max(lowCoord, upCoord);
            }
        }
        return result;
    },

    /**
     * @ignore
     * @static
     * @name util.bounds.toGlobalPixelBounds
     * Производит перевод границ из геокоординат в глобальные пиксели с учетом масштаба.
     * @param {Number[][]} geoBounds Исходные границы.
     * @param {IProjection} projection Проекция, в координатной системе которой заданы геокоординаты.
     * @param {Number} zoom Масштаб.
     * @returns {Number[][]} Вычисленные пиксельные границы.
     */
    toGlobalPixelBounds: function (geoBounds, projection, zoom) {
        var lowerCorner = projection.toGlobalPixels(geoBounds[0], zoom),
            upperCorner = projection.toGlobalPixels(geoBounds[1], zoom),
            projectionCycled = projection.isCycled(),
            worldSize = Math.pow(2, zoom + 8),
            center,
            result = [
                lowerCorner.slice(),
                upperCorner.slice()
            ];

        if (lowerCorner[0] > upperCorner[0]) {
            if (projectionCycled[0]) {
                // По зацикленным осям выбираем интервал так, чтобы центр лежал в нулевом мире
                center = (lowerCorner[0] + upperCorner[0]) / 2;
                if (center < worldSize / 2) {
                    result[0][0] = lowerCorner[0];
                    result[1][0] = upperCorner[0] + worldSize;
                } else {
                    result[0][0] = lowerCorner[0] - worldSize;
                    result[1][0] = upperCorner[0];
                }
            } else {
                result[0][0] = upperCorner[0];
                result[1][0] = lowerCorner[0];
            }
        }

        if (lowerCorner[1] > upperCorner[1]) {
            if (projectionCycled[1]) {
                // По зацикленным осям выбираем интервал так, чтобы центр лежал в нулевом мире
                center = (lowerCorner[1] + upperCorner[1]) / 2;
                if (center < worldSize / 2) {
                    result[0][1] = lowerCorner[1];
                    result[1][1] = upperCorner[1] + worldSize;
                } else {
                    result[0][1] = lowerCorner[1] - worldSize;
                    result[1][1] = upperCorner[1];
                }
            } else {
                result[0][1] = upperCorner[1];
                result[1][1] = lowerCorner[1];
            }
        }

        return result;
    },
    _containsPoint: function (bounds, point, projection) {
        if (projection) {
            bounds = utilBounds.toGlobalPixelBounds(bounds, projection, 0);
            point = projection.toGlobalPixels(point, 0);
        }
        return point[0] >= bounds[0][0] && point[0] <= bounds[1][0] &&
               point[1] >= bounds[1][1] && point[1] <= bounds[0][1];
               // point[1] >= bounds[0][1] && point[1] <= bounds[1][1];
    }
};
