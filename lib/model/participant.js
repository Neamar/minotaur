'use strict';

var mongoose = require('mongoose');

var ParticipantSchema = new mongoose.Schema({
  tournament: {
    required: true,
    type: mongoose.Schema.Types.ObjectId
  },
  name: {
    required: true,
    type: String
  },
  summonerId: {
    required: true,
    type: Number
  },
  // List of games with format "championid:gameid"
  games: [{
    type: String,
  }],
  score: {
    type: Number,
    required: true,
    default: 0
  },
});

module.exports = mongoose.model("Participant", ParticipantSchema);
