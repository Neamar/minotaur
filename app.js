"use strict";

var express = require('express');
var mongoose = require('mongoose');

var config = require('./config');
var app = express();

// var handlers = require('./lib').handler;
// var middlewares = require('./lib').middleware;

mongoose.connect(config.mongoUrl);

module.exports = app;
