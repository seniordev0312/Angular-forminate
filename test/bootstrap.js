/* eslint-env mocha */
'use strict';

var express = require('express');
var request = require('supertest');
var mongoose = require('mongoose');
var events = require('events');
var Q = require('q');

module.exports = function(app, server, settings, mount, config) {
  // Track the status of the initial test bootstrap.
  var bootstrap = Q.defer();

  // Use the given express app or default;
  app = app || express();

  // Use the given router or default to the formio server.
  config = config || require('./config.json');
  var formioServer = server || require('../index')(config);

  // Initialize the formio router.
  formioServer.init(settings).then(function(_formio) {
    // Allow tests access to formio.
    app.formio = _formio;

    // Expose server internals.
    app._server = formioServer;

    // Use the formio router and optional mounting point.
    if (mount) {
      app.use(mount, formioServer);
    } else {
      app.use(formioServer);
    }

    // Say we are ready.
    bootstrap.resolve({
      app: app,
      template: template
    });
  });

  // The default project template.
  var template = require('./template')();

  return bootstrap.promise;
};
