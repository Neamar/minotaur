"use strict";
var async = require('async');
var riotRequest = require('./request');
var duration = require('../helper/duration');

// Create cargo limit
var API_LIMIT = 40;
module.exports = function mapNameToIds(region, summoners, callback) {
  var results = [];

  var cargo = async.cargo(function(summonerNames, cb) {

    var endpoint = '/api/lol/' + region.toLowerCase() + '/v1.4/summoner/by-name/' + encodeURIComponent(summonerNames.join(','));

    riotRequest(region, endpoint, duration.A_DAY, function(err, data) {
      if(err) {
        if(err && err.statusCode === 404) {
          return cb(null, null);
        }
        return cb(err);
      }
      console.log(data);

      if(!data) {
        err = new Error("Issues with the Riot API :( [EMPTY_SUMM_DATA]");
        err.riotInternal = true;
        return cb(err);
      }

      Object.keys(data).forEach(function(key) {
        results.push({
          query: key,
          name: data[key].name
        });
      });

      cb();
    });

  }, API_LIMIT);

  cargo.drain = function() {
    
    return callback(null, results.sort(function(a, b) {
      if(a.name > b.name) {
        return 1
      }
      else if(a.name < b.name) {
        return -1
      }
      else {
        return 0;
      }

    }));
  };

  cargo.push(summoners);
};
