'use strict';

var mongoose = require('mongoose');

var TournamentSchema = new mongoose.Schema({
  title: {
    required: true,
    type: String
  },
  description: {
    required: true,
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  region: {
    type: String,
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
});

module.exports = mongoose.model("Tournament", TournamentSchema);
