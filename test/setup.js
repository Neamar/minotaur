'use strict';
var nock = require("nock");


beforeEach(function cleanCaches() {
  // Previous nocks
  nock.cleanAll();
});
