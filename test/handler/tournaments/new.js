"use strict";

var supertest = require("supertest");
var app = require('../../../app.js');


describe("/tournaments/new", function() {
  describe("GET", function() {
    it("should return an HTML form", function(done) {
      supertest(app)
        .get('/tournaments/new')
        .expect(200)
        .expect(/<form/)
        .end(done);
    });
  });
});
