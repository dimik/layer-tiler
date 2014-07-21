var should = require("should");

describe("Projection", function () {
  var ProjectionFactory = require('../lib/projection/factory');

  it("factory can be instantiated", function (done) {
    var projection = new ProjectionFactory({ coordOrder: 'longlat' });

    projection.should.be.an.Object;
    projection.should.have.property('create').and.be.a.Function;

    done();
  });

  describe("wgs84Mercator", function () {
    var projection = new ProjectionFactory({ coordOrder: 'latlong' });
    var wgs84Mercator = projection.create('wgs84Mercator');

    it("can be created", function (done) {
      wgs84Mercator.should.be.an.Object;
      wgs84Mercator.fromGlobalPixels.should.be.a.Function.and.have.lengthOf(2);
      wgs84Mercator.toGlobalPixels.should.be.a.Function.and.have.lengthOf(2);

      done();
    });

    it("#fromGlobalPixels()", function (done) {
      var coords = wgs84Mercator.fromGlobalPixels([100, 100], 10);

      coords.should.be.an.Array.and.have.lengthOf(2);
      coords.should.eql([ 85.07227610506499, -179.8626708984375 ]);

      done();
    });

    it("#toGlobalPixels()", function (done) {
      var coords = wgs84Mercator.toGlobalPixels([55.7, 37.5], 10);

      coords.should.be.an.Array.and.have.lengthOf(2);
      coords.should.eql([158378.66666666666, 82250.12460366159]);

      done();
    });

  });

  describe("sphericalMercator", function () {
    var projection = new ProjectionFactory({ coordOrder: 'latlong' });
    var sphericalMercator = projection.create('sphericalMercator');

    it("can be created", function (done) {
      sphericalMercator.should.be.an.Object;
      sphericalMercator.fromGlobalPixels.should.be.a.Function.and.have.lengthOf(2);
      sphericalMercator.toGlobalPixels.should.be.a.Function.and.have.lengthOf(2);

      done();
    });

    it("#fromGlobalPixels()", function (done) {
      var coords = sphericalMercator.fromGlobalPixels([100, 100], 10);

      coords.should.be.an.Array.and.have.lengthOf(2);
      coords.should.eql([85.03926769025156, -179.8626708984375]);

      done();
    });

    it("#toGlobalPixels()", function (done) {
      var coords = sphericalMercator.toGlobalPixels([55.7, 37.5], 10);

      coords.should.be.an.Array.and.have.lengthOf(2);
      coords.should.eql([158378.66666666666, 82019.04329898844]);

      done();
    });

  });

  describe("Cartesian", function () {
    var projection = new ProjectionFactory({ coordOrder: 'latlong' });
    var cartesian = projection.create('cartesian', {
      bounds: [[-1, -1], [1, 1]],
      scale: 1
    });

    it("can be created", function (done) {
      cartesian.should.be.an.Object;
      cartesian.fromGlobalPixels.should.be.a.Function.and.have.lengthOf(2);
      cartesian.toGlobalPixels.should.be.a.Function.and.have.lengthOf(2);

      done();
    });

    it("#fromGlobalPixels()", function (done) {
      var coords = cartesian.fromGlobalPixels([ 157696, 81920 ], 10);

      coords.should.be.an.Array.and.have.lengthOf(2);
      coords.should.eql([ 0.375, 0.203125 ]);

      done();
    });

    it("#toGlobalPixels()", function (done) {
      var coords = cartesian.toGlobalPixels([0, 0], 10);

      coords.should.be.an.Array.and.have.lengthOf(2);
      coords.should.eql([ 131072, 131072 ]);

      done();
    });

  });
});
