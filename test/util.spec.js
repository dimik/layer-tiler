var should = require('should');

describe("Util", function () {
    var util = require('../lib/util');

    describe("Util.bounds", function () {
        describe("Util.bounds.contains", function () {
          it("should contains bounds", function (done) {
            var result = util.bounds.contains(
                [ [ 10496, 6400 ], [ 10752, 6144 ] ],
                [ [ 10496, 6400 ], [ 10752, 6144 ] ]
            );

            result.should.be.True;

            done();
          });

        });
    });
});
