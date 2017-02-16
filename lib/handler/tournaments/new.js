"use strict";

var mongoose = require('mongoose');
var async = require('async');
var rarity = require("rarity");

var mapNameToIds = require('../../riot-api/map-name-to-ids.js');
var riotRequest = require('../../riot-api/request.js');


var MONGO_CONCURRENT_LIMIT = 20;

module.exports.get = function get(req, res) {
  var todayMidnight = new Date();
  todayMidnight.setSeconds(0);
  todayMidnight.setMilliseconds(0);
  todayMidnight.setMinutes(0);
  todayMidnight.setHours(0);
  var tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('.000Z', '');
  var inaWeekMidnight = new Date(todayMidnight.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().replace('.000Z', '');

  res.render('tournaments/new', {defaultStart: tomorrowMidnight, defaultEnd: inaWeekMidnight, regions: riotRequest.REGIONS});
};


module.exports.post = function post(req, res) {
  var region = req.body.region;

  var summoners = req.body.summoners.split("\n")
    .map(s => s.trim())
    .filter(s => s);

  if(summoners.length === 0) {
    res.status(400).send("Please specify at least one summoner!");
    return;
  }

  // Load our models
  var Participant = mongoose.model('Participant');
  var Tournament = mongoose.model('Tournament');

  // create the base Tournament;
  async.waterfall([
    function createTournament(cb) {
      var t = new Tournament();
      t.title = req.body.title;
      t.description = req.body.description;
      t.region = req.body.region;
      t.startDate = req.body.start;
      t.endDate = req.body.end;
      t.save(rarity.slice(2, cb));
    },
    function getIds(tournament, cb) {
      mapNameToIds(region, summoners, rarity.carry([tournament], cb));
    },
    function createParticipants(tournament, summonerInformation, cb) {
      async.eachLimit(summonerInformation, MONGO_CONCURRENT_LIMIT, function(summoner, cb) {
        var p = new Participant();
        p.tournament = tournament;
        p.summonerId = summoner.id;
        p.name = summoner.name;
        p.save(cb);
      }, rarity.carry([tournament], cb));
    },
    function redirect(tournament, cb) {
      res.redirect('/tournament/' + tournament._id);

      cb();
    }
  ], function(err) {
    if(err) {
      res.status(400).send("Error trying to create Tournament:" + err);
      return;
    }
  });
};
