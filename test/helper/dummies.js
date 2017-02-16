"use strict";
var mongoose = require("mongoose");

var Tournament = mongoose.model('Tournament');
var Participant = mongoose.model('Participant');

module.exports.getDummyTournament = function getDummyTournament() {
  var tournament = new Tournament();
  tournament.title = tournament.description = "Test";
  tournament.region = "euw";
  tournament.startDate =  new Date();
  tournament.endDate =  new Date(new Date().getTime() + 60000);
  return tournament;
};

module.exports.getDummyParticipant = function getDummyParticipant(tournament) {
  var participant = new Participant();
  participant.tournament = tournament;
  participant.name = "Participant #" + module.exports.getDummyParticipant.count;
  participant.summonerId = module.exports.getDummyParticipant.count;
  participant.region = "euw";
  module.exports.getDummyParticipant.count += 1;
  return participant;
};
module.exports.getDummyParticipant.count = 0;
