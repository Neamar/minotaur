"use strict";

var mapNameToIds = require('../../riot-api/map-name-to-ids.js');
var riotRequest = require('../../riot-api/request.js');

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
  var summoners = req.body.summoners.split("\n")
    .map(s => s.trim())
    .filter(s => s);


};
