"use strict";

var mongoose = require('mongoose');
var async = require('async');
var assert = require('assert');
var supertest = require("supertest");
var recorder = require('../../mocks/recorder.js');
var app = require('../../../app.js');



describe("/tournaments/new", function() {
  // Load our models
  var Tournament = mongoose.model('Tournament');

  describe("GET", function() {
    it("should return an HTML form", function(done) {
      supertest(app)
        .get('/tournaments/new')
        .expect(200)
        .expect(/<form/)
        .end(done);
    });
  });

  describe("POST", function() {
    it('should require at least one user', function(done) {
      done = recorder.useNock(this, done);

      var tournamentData = {
        region: 'euw', title: 'title1', description: 'desc1', summoners: '', start: new Date(), end: new Date()
      };

      async.waterfall([
        function doRequest(cb) {
          supertest(app)
            .post('/tournaments/new')
            .send(tournamentData)
            .expect(400)
            .expect(/at least one summoner/i)
            .end(cb);
        },
      ], done);
    });

    it('should create a tournament with valid users', function(done) {
      done = recorder.useNock(this, done);

      var tournamentData = {
        region: 'euw', title: 'title1', description: 'desc1', summoners: 'psykzz\r\nriotneamar', start: new Date(), end: new Date()
      };

      async.waterfall([
        function doRequest(cb) {
          supertest(app)
            .post('/tournaments/new')
            .send(tournamentData)
            .expect(302)
            .end(cb);
        },
        function validateTournament(res, cb) {
          Tournament.findOne({title: tournamentData.title}, cb);
        },
        function validateTournament(t, cb) {
          Tournament.findOne({title: tournamentData.title}, cb);
        },
        function dataCorrect(t, cb) {
          assert.equal(t.title, tournamentData.title);
          cb();
        }
      ], done);
    });
  });
});
