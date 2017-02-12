"use strict";

var express = require('express');
var bodyParser = require('body-parser');

var mongoose = require('mongoose');

var config = require('./config');
var app = express();

app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

var handlers = require('./lib').handler;
// var middlewares = require('./lib').middleware;

app.get('/tournaments/new', handlers.tournaments.new.get);
app.post('/tournaments/new', handlers.tournaments.new.post);

mongoose.connect(config.mongoUrl);

module.exports = app;
