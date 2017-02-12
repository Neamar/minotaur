"use strict";


module.exports.get = function get(req, res) {
  var todayMidnight = new Date();
  todayMidnight.setSeconds(0);
  todayMidnight.setMilliseconds(0);
  todayMidnight.setMinutes(0);
  todayMidnight.setHours(0);
  var tomorrowMidnight = new Date(todayMidnight.getTime() + 24 * 60 * 60 * 1000).toISOString().replace('.000Z', '');
  var inaWeekMidnight = new Date(todayMidnight.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().replace('.000Z', '');

  res.render('tournaments/new', {defaultStart: tomorrowMidnight, defaultEnd: inaWeekMidnight});
};


module.exports.post = function post(req, res) {
  res.send(req.body);
};
