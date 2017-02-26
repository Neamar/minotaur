"use strict";

var assert = require("assert");
var mongoose = require("mongoose");
var async = require("async");
var sinon = require("sinon");
var nock = require('nock');
var rarity = require("rarity");

var scoreTrackerWorker = require('../../../lib/worker/score-tracker/worker.js');

var Participant = mongoose.model('Participant');
var getDummyParticipant = require('../../helper/dummies.js').getDummyParticipant;

var mockRecentData = require('../../mocks/mocks/custom_get_game_by_summoner.json');


describe("pushNotifier worker", function() {
  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  it("should do nothing when games are before tournament start", function(done) {
    var participant = getDummyParticipant();
    participant.startDate = new Date(mockRecentData.games[0].createDate + 1500);
    participant.endDate = new Date(participant.startDate.getTime() + 30 * 24 * 60 * 1000);

    nock('https://euw.api.pvp.net')
      .get('/api/lol/na/v1.3/game/by-summoner/' + participant.summonerId + '/recent')
      .query(true)
      .reply(200, mockRecentData);

    async.waterfall([
      function work(cb) {
        scoreTrackerWorker(participant, cb);
      },
      function check(gamesCount, cb) {
        assert.equal(gamesCount, 0);

        cb();
      }
    ], done);
  });

  it("should do nothing when games are after tournament end", function(done) {
    var participant = getDummyParticipant();
    participant.endDate = new Date(mockRecentData.games[0].createDate - 1500);
    participant.startDate = new Date(participant.endDate.getTime() - 30 * 24 * 60 * 1000);

    nock('https://euw.api.pvp.net')
      .get('/api/lol/na/v1.3/game/by-summoner/' + participant.summonerId + '/recent')
      .query(true)
      .reply(200, mockRecentData);

    async.waterfall([
      function work(cb) {
        scoreTrackerWorker(participant, cb);
      },
      function check(gamesCount, cb) {
        assert.equal(gamesCount, 0);

        cb();
      }
    ], done);
  });

  it("should do nothing when last game is already saved", function(done) {
    var participant = getDummyParticipant();
    participant.startDate = new Date(mockRecentData.games[0].createDate - 1500);
    participant.endDate = new Date(participant.startDate.getTime() + 30 * 24 * 60 * 1000);
    participant.lastKnownGameId = mockRecentData.games[0].gameId;

    nock('https://euw.api.pvp.net')
      .get('/api/lol/na/v1.3/game/by-summoner/' + participant.summonerId + '/recent')
      .query(true)
      .reply(200, mockRecentData);

    async.waterfall([
      function work(cb) {
        scoreTrackerWorker(participant, cb);
      },
      function check(gamesCount, cb) {
        assert.equal(gamesCount, 0);

        cb();
      }
    ], done);
  });

  it("should save games within tournament date", function(done) {
    var participant = getDummyParticipant("58b1e0ef1e758c42792ed55c");
    participant.startDate = new Date(mockRecentData.games[8].createDate);
    participant.endDate = new Date(mockRecentData.games[2].createDate);
    participant.lastKnownGameId = -1;

    nock('https://euw.api.pvp.net')
      .get('/api/lol/euw/v1.3/game/by-summoner/' + participant.summonerId + '/recent')
      .query(true)
      .reply(200, mockRecentData);

    async.waterfall([
      function save(cb) {
        participant.save(cb);
      },
      function work(p, count, cb) {
        scoreTrackerWorker(participant, rarity.carry([p], cb));
      },
      function check(p, gamesCount, cb) {
        // There is a custom game in the mock dataset, so 5 - 1
        assert.equal(gamesCount, 4);

        cb(null, p);
      },
      function reloadParticipant(p, cb) {
        Participant.findById(p._id, cb);
      },
      function ensureParticipantWasUpdated(p, cb) {
        assert.equal(p.lastKnownGameId, mockRecentData.games[3].gameId);
        assert.equal(p.games.length, 4);
        assert.equal(p.games[0].id, mockRecentData.games[3].gameId);

        cb();
      }
    ], done);
  });
});
