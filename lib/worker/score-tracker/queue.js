'use strict';

var async = require("async");
var mongoose = require('mongoose');
var debug = require('debug')('minotaur:worker:score-tracker:queue');
var FJQ = require('featureless-job-queue');
var newrelic = require("newrelic");
var rarity = require("rarity");

var config = require('../../../config');
var errorLogger = require('../../error-logger.js');
var metricTracker = require('../../metric-tracker.js');
var queueWorker = require('./worker.js');

const QUEUE_CONCURRENCY = config.pushNotifierQueueConcurrency;

var fjq = new FJQ({
  redisUrl: config.redisUrl
});

module.exports = function startQueue(options) {
  if(!options) {
    options = {};
  }

  options.thunderingHerdSpan = 'thunderingHerdSpan' in options ? options.thunderingHerdSpan : 30000;

  var refillQueueWorker = newrelic.createBackgroundTransaction('score-tracker:refillQueue', 'workers', function queueRefillerWorker(job, cb) {
    var lastLoopStartedAt = new Date(job.startedAt);
    var refillStartedAt = new Date();
    var activeTournamentsCount;
    var participantsCount;

    async.waterfall([
      function getLength(cb) {
        fjq.length(cb);
      },
      function ensureEmpty(count, cb) {
        // The refill task should always be last, if it's not then something is wrong.
        // The most likely explanation is that two queues are present in Redis, and we need to fix this.
        if(count !== 0) {
          cb(new Error("Trying to refill a non empty queue"));
          return;
        }

        cb();
      },
      function findActiveTournaments(cb) {
        mongoose.model('Tournament').find({startDate: {$lt: new Date()}, endDate: {$gt: new Date()}}).read('secondaryPreferred').select('_id title region').lean().exec(cb);
      },
      function findParticipants(tournaments, cb) {
        debug("Active tournaments: "  + tournaments.length);
        activeTournamentsCount = tournaments.length;

        var ids = tournaments.map((t) => t._id);

        mongoose.model("Participant").find({tournament: {$in: ids}}).read('secondaryPreferred').select('_id tournament name summonerId region lastKnownGameId').lean().exec(rarity.carry([tournaments], cb));
      },
      function addParticipantsToQueue(tournaments, participants, cb) {
        participantsCount = participants.length;

        var tournamentDates = tournaments.reduce(function(acc, t) {
          acc[t._id] = {
            startDate: t.startDate,
            endDate: t.endDate,
          };

          return acc;
        }, {});

        participants.forEach(function(p) {
          p.startDate = tournamentDates[p.tournament].startDate;
          p.endDate = tournamentDates[p.tournament].endDate;
        });

        fjq.create(participants, cb);
      },
      function addDelayOnSmallDataset(cb) {
        /* istanbul ignore next */
        if(participantsCount < 10 && process.env.NODE_ENV === "production") {
          setTimeout(cb, 5000);
          return;
        }
        cb();
      },
      function addRefillTaskToQueue(cb) {
        fjq.create({
          refillQueue: true,
          startedAt: new Date(),
        }, cb);
      },
      function sendMetrics(cb) {
        var now = new Date();
        var timeToLoop = now.getTime() - lastLoopStartedAt.getTime();
        var timeToLoopSeconds = Math.round(timeToLoop / 1000);
        var timeToRefill = now.getTime() - refillStartedAt.getTime();
        var timeToRefillSeconds = Math.round(timeToRefill / 1000);

        debug("Looping over (" + participantsCount + " participants in " + timeToLoopSeconds + "s) (refill time: " + timeToRefillSeconds + "s)");

        var threshold = 60;
        if(timeToLoopSeconds > threshold) {
          debug("More than " + threshold + "s to loop over " + participantsCount + " participants -- " + timeToLoopSeconds + "s :(");
        }

        metricTracker("Worker.ScoreTracker.LoopDuration", timeToLoop);
        metricTracker("Worker.ScoreTracker.RefillDuration", timeToRefill);
        metricTracker("Worker.ScoreTracker.ParticipantsCounter", participantsCount);
        metricTracker("Worker.ScoreTracker.ActiveTournamentCounter", activeTournamentsCount);

        cb(null);
      },
    ], function(err) {
      if(err && err.toString().indexOf("queue was shutdown") !== -1) {
        // Worker has been shutdown, and we can't create jobs anymore. That's fine, potentialInitializer() will do the refill on next startup
        err = null;
      }

      if(err) {
        errorLogger(err, {log: debug});
      }

      // options.cb can be specified to be called *after* each loop
      if(options.cb) {
        options.cb(err, participantsCount);
      }

      newrelic.endTransaction();
      cb(err);
    });
  });

  // Send jobs to the correct worker (either a scoreTracker or a refillQueue)
  fjq.process(function(job, cb) {
    if(job.refillQueue) {
      return refillQueueWorker(job, cb);
    }
    queueWorker(job, cb);
  }, QUEUE_CONCURRENCY);

  debug("Started " + QUEUE_CONCURRENCY + " workers");

  setTimeout(function potentialInitializer() {
    // This is only used on an empty Redis collection.
    // The setTimeout prevents a thundering herd on on initialization in a multi-server deployment
    fjq.length(function(err, count) {
      if(err) {
        return errorLogger(err, {log: debug});
      }

      if(count === 0) {
        debug("Empty initial queue :( adding refill task");
        refillQueueWorker({
          refillQueue: true,
          startedAt: new Date(),
        }, errorLogger);
      }
      else {
        debug("Starting worker, currently " + count + " jobs in queue.");
      }
    });
  }, Math.random() * options.thunderingHerdSpan);

  // Do not register sigterm receiver when testing
  /* istanbul ignore next */
  if(!options.testing) {
    process.once('SIGTERM', function stopQueue() {
      debug("Received SIGTERM, pausing queue.");
      // Dyno is dying, finish current stuff but do not start the processing of new tasks.
      fjq.shutdown(function(err) {
        if(err) {
          errorLogger(err);
        }
        else {
          debug("Shutting down process after SIGTERM, workers were paused.");
          process.exit(0);
        }
      });
    });
  }
};

module.exports.fjq = fjq;
