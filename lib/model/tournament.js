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
    required: true,
    type: String,
  },
  startDate: {
    required: true,
    type: Date,
  },
  endDate: {
    required: true,
    type: Date,
  },
});

module.exports = mongoose.model("Tournament", TournamentSchema);
