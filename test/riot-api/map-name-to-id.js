"use strict";

var assert = require('assert');

var nameToIds = require('../../lib/riot-api/map-name-to-ids');
var recorder = require('../mocks/recorder.js');


describe('Name to Id Mapping', function() {
  it('should return the right result', function(done) {
    done = recorder.useNock(this, done);

    var expected = [
      {
        id: 24329494,
        query: "psykzz",
        name: "PsyKzz"
      },
      {
        id: 70448430,
        query: "riotneamar",
        name: "Riot Neamar"
      }
    ];

    nameToIds('EUW', ['psykzz', 'riotneamar'], function(err, results) {
      assert.deepEqual(results, expected);
      done();
    });
  });
});
