"use strict";

var mongoose = require('mongoose');
var async = require('async');
var assert = require('assert');
var supertest = require("supertest");
var rarity = require("rarity");

var app = require('../../../app.js');


describe("/tournaments/:id", function() {
  // Load our models
  var Tournament = mongoose.model('Tournament');
  var Participant = mongoose.model('Participant');

  var getDummyTournament = function() {
    var tournament = new Tournament();
    tournament.title = tournament.description = "Test";
    tournament.region = "euw";
    tournament.startDate =  new Date();
    tournament.endDate =  new Date(new Date().getTime() + 60000);
    return tournament;
  };

  var getDummyParticipant = function(tournament) {
    var participant = new Participant();
    participant.tournament = tournament;
    participant.name = "Participant #" + getDummyParticipant.count;
    participant.summonerId = getDummyParticipant.count;
    getDummyParticipant.count += 1;
    return participant;
  };
  getDummyParticipant.count = 0;

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
