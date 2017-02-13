"use strict";
var async = require('async');
var riotRequest = require('./request');
var duration = require('../helper/duration');

// Create cargo limit
var API_LIMIT = 40;
module.exports = function mapNameToIds(region, summoners, done) {
  var results = [];

  var cargo = async.cargo(function(summonerNames, cb) {

    var endpoint = '/api/lol/' + region.toLowerCase() + '/v1.4/summoner/by-name/' + encodeURIComponent(summonerNames.join(','));

    riotRequest(region, endpoint, function(err, data) {
      if(err) {
        if(err && err.statusCode === 404) {
          return cb(null, null);
        }
        return cb(err);
      }

      if(!data) {
        err = new Error("Issues with the Riot API :( [EMPTY_SUMM_DATA]");
        err.riotInternal = true;
        return cb(err);
      }

      Object.keys(data).forEach(function(key) {
        data[key].query = key
        results.push({
          query: key,
          name: data[key].name,
          id: data[key].id
        });
      });

      cb();
    });

  }, API_LIMIT);

  cargo.drain = function() {
    var results = results.filter(r => r).sort(function(a, b) {
      return(a.name > b.name) ? 1 : -1;
    })
    return done(null, results);
  };

  cargo.push(summoners);
};
