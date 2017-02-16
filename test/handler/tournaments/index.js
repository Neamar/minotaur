"use strict";

var async = require('async');
var assert = require('assert');
var supertest = require("supertest");
var rarity = require("rarity");

var getDummyTournament = require('../../helper/dummies.js').getDummyTournament;
var getDummyParticipant = require('../../helper/dummies.js').getDummyParticipant;
var app = require('../../../app.js');


describe("/tournaments/:id", function() {
  describe("GET", function() {
    it("should require an existing tournament code", function(done) {
      supertest(app)
        .get('/tournaments/404')
        .expect(404)
        .expect(/tournament does not exists/i)
        .end(done);
    });

    it('should require the user to specify his summoner name before seeing tournament data', function(done) {
      var tournamentData = getDummyTournament();
      async.waterfall([
        function createTournament(cb) {
          tournamentData.save(rarity.slice(2, cb));
        },
        function createParticipant(tournament, cb) {
          tournamentData = tournament;
          var participant = getDummyParticipant(tournament);
          participant.save(rarity.slice(2, cb));
        },
        function getPage(participant, cb) {
          supertest(app)
            .get("/tournaments/" + tournamentData._id)
            .expect(200)
            .expect(/enter your summoner name/i)
            .end(cb);
        },
      ], done);
    });

    it('should display leaderboard when summoner name is specified', function(done) {
      var tournamentData = getDummyTournament();
      async.waterfall([
        function createTournament(cb) {
          tournamentData.save(rarity.slice(2, cb));
        },
        function createParticipant(tournament, cb) {
          tournamentData = tournament;
          var participant = getDummyParticipant(tournament);
          participant.score = 555;
          participant.save(rarity.slice(2, cb));
        },
        function getPage(participant, cb) {
          supertest(app)
            .get("/tournaments/" + tournamentData._id + "?summoner=" + encodeURIComponent(participant.name))
            .expect(200)
            .expect(/Participant #/i)
            .expect(/555/i)
            .end(cb);
        },
      ], done);
    });
  });
});
