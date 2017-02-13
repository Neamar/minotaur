"use strict";

var mongoose = require('mongoose');
var async = require('async');
var assert = require('assert');
var supertest = require("supertest");
var recorder = require('../../mocks/recorder.js');
var app = require('../../../app.js');

// Load our models
var Participant = mongoose.model('Participant');
var Tournament = mongoose.model('Tournament');


describe("/tournaments/new", function() {
  describe("GET", function() {
    it("should return an HTML form", function(done) {
      supertest(app)
        .get('/tournaments/new')
        .expect(200)
        .expect(/<form/)
        .end(done);
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
        function validateTourn(res, cb) {
          Tournament.findOne({title: tournamentData.title}, cb);
        },
        function dataCorrect(t, cb) {
          assert.equal(t.title, tournamentData.title);
          cb();
        }
      ], done);
    })
  });
});
