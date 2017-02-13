"use strict";
require('newrelic');

require('./_common');
require('../app');

// Start worker
require('../lib/worker/score-tracker/queue')({loop: true});
