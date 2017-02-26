"use strict";

var assert = require("assert");
var mongoose = require("mongoose");
var async = require("async");
var sinon = require("sinon");
var rarity = require("rarity");
var scoreTrackerQueue = require('../../../lib/worker/score-tracker/queue.js');

var Tournament = mongoose.model('Tournament');
var Participant = mongoose.model('Participant');
var getDummyTournament = require('../../helper/dummies.js').getDummyTournament;
var getDummyParticipant = require('../../helper/dummies.js').getDummyParticipant;


describe("scoreTracker queue", function() {
  beforeEach(function clearParticipant(done) {
    Participant.remove({}, done);
  });

  beforeEach(function clearTournament(done) {
    Tournament.remove({}, done);
  });

  beforeEach(function clearRedis(done) {
    scoreTrackerQueue.fjq.clearAll(done);
  });

  beforeEach(function() {
    this.sandbox = sinon.sandbox.create();
  });

  afterEach(function() {
    this.sandbox.restore();
  });

  it("should iterate over all active tournaments", function(done) {
    this.sandbox.stub(scoreTrackerQueue.fjq, 'create', function(jobs, cb) {
      cb();
    });

    async.waterfall([
      function createTournament(cb) {
        getDummyTournament().save(rarity.slice(2, cb));
      },
      function createParticipants(tournament, cb) {
        async.parallel([
          function p1(cb) {
            getDummyParticipant(tournament).save(rarity.slice(2, cb));
          },
          function p2(cb) {
            getDummyParticipant(tournament).save(rarity.slice(2, cb));
          }
        ], cb);
      },
      function(res, cb) {
        var options = {
          testing: true,
          thunderingHerdSpan: 0,
        };
        options.cb = cb;

        scoreTrackerQueue(options);
      },
      function(participantsCounter, cb) {

        assert.equal(participantsCounter, 2);
        // 2 participants (in one create) + one refill = 2
        sinon.assert.callCount(scoreTrackerQueue.fjq.create, 2);
        assert.equal(scoreTrackerQueue.fjq.create.getCall(0).args[0].length, 2);
        assert.equal(scoreTrackerQueue.fjq.create.getCall(1).args[0].refillQueue, true);

        cb();
      },
    ], done);
  });
});
