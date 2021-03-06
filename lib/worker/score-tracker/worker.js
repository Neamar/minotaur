'use strict';

var async = require("async");
var GCM = require("gcm").GCM;
var mongoose = require("mongoose");
var newrelic = require("newrelic");
var rarity = require("rarity");
var debug = require('debug')('minotaur:worker:score-tracker:worker');

var config = require('../../../config/');
var summonerInfo = require('../../riot-api/summoner-info.js');
var errorLogger = require('../../error-logger.js');


// Used as a flag to skip the loop while ensuring the last function is run
var passthrough = new Error("not an error");

var gcm = new GCM(config.gcmApiKey);

module.exports = newrelic.createBackgroundTransaction('score-tracker:read-games', 'workers', function queueWorker(participant, cb) {
  var gamesCount = 0;

  async.waterfall([
    function getLastGames(cb) {
      summonerInfo.getRecentMatches(participant.summonerId, participant.region, cb);
    },
    function analyzeResult(res, cb) {
      if(res.games[0].gameId === participant.lastKnownGameId) {
        // No new games for us.
        return cb(passthrough);
      }

      var gamesToImport = [];
      for(var i = 0; i < res.games.length; i += 1) {
        var game = res.games[i];
        if(game.gameId === participant.lastKnownGameId) {
          break;
        }

        var gameDate = new Date(game.createDate);

        if(gameDate <= participant.startDate) {
          break;
        }
        if(gameDate >= participant.endDate) {
          continue;
        }

        if(game.gameType === "CUSTOM_GAME") {
          continue;
        }

        // Otherwise, the game qualifies.
        var stats = {
          id: game.gameId,
          score: game.stats.championsKilled - game.stats.numDeaths + game.stats.assists
        };

        gamesToImport.push(stats);

        debug("Adding a game for " + participant.name + " (" + participant.region + "), score " + stats.score);
      }
      gamesCount = gamesToImport.length;

      if(gamesCount === 0) {
        process.nextTick(cb);
        return;
      }

      mongoose.model('Participant').update({_id: participant._id}, {
        $addToSet: {
          games: {
            $each: gamesToImport
          }
        },
        $set: {
          lastKnownGameId: gamesToImport[0].id
        }
      }, rarity.slice(1, cb));
    }
  ], function(err) {
    if(err && err === passthrough) {
      err = null;
    }

    if(err && err.riotInternal) {
      debug(err);
      // We're not interested in issues with the Riot API, so skip them
      err = null;
    }

    if(err) {
      errorLogger(err, {log: debug, user: {name: participant.name, region: participant.region}});
    }

    newrelic.endTransaction();

    cb(null, gamesCount);
  });
});


// Default gcm is exposed here, to be overriden in tests
module.exports.gcm = gcm;

/* istanbul ignore next */
if(process.env.DRY_RUN) {
  module.exports.gcm = {
    send: function(data, cb) {
      process.nextTick(function() {
        cb(null, "fakemessageid");
      });
    }
  };
}
