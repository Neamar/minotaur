"use strict";

var assert = require('assert');
var nameToIds = require('../../lib/riot-api/map-name-to-ids');

describe('Name to Id Mapping', function() {
  it.only('should return the right result', function(done) {

    /*

    NOCK Info
    response

    { psykzz:
   { summonerLevel: 30,
     revisionDate: 1485972405000,
     profileIconId: 1426,
     name: 'PsyKzz',
     id: 24329494 },
  riotneamar:
   { summonerLevel: 30,
     revisionDate: 1486856143000,
     profileIconId: 773,
     name: 'Riot Neamar',
     id: 70448430 } }

     */

    var expected = [
      {
        query: "psykzz",
        name: "PsyKzz"
      },
      {
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
