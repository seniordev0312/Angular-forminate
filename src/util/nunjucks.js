'use strict';

var clone = require('clone');
var vm = require('vm');
var nunjucks = require('nunjucks');
var _ = require('lodash');
var debug = require('debug')('formio:util:nunjucks');

// Configure nunjucks to not watch any files
var environment = nunjucks.configure([], {
  watch: false
});

environment.addFilter('is_string', function(obj) {
  return _.isString(obj);
});

environment.addFilter('is_array', function(obj) {
  return _.isArray(obj);
});

environment.addFilter('is_object', function(obj) {
  return _.isPlainObject(obj);
});

// Script to render a single string.
var script = new vm.Script(
  'environment.params = clone(context);' +
  'if (context._private) { delete context._private; }' +
  'output = environment.renderString(input, context);'
);

// Script to render an object of properties.
var objScript = new vm.Script(
  'environment.params = clone(context);' +
  'if (context._private) {' +
    'delete context._private;' +
  '}' +
  'context._rendered = {};' +
  'for (var prop in input) {' +
    'if (input.hasOwnProperty(prop)) {' +
      'context._rendered[prop] = output[prop] = environment.renderString(input[prop], context);' +
    '}' +
  '}'
);

module.exports = {
  environment: environment,
  render: function(string, context) {
    var rendered = '';
    try {
      var sandbox = {
        output: '',
        input: string,
        clone: clone,
        environment: environment,
        context: context
      };
      script.runInContext(vm.createContext(sandbox), {
        timeout: 500
      });
      rendered = sandbox.output;
    }
    catch (e) {
      debug(e);
      rendered = null;
    }
    return rendered;
  },
  renderObj: function(obj, context) {
    var rendered = '';
    try {
      var sandbox = {
        output: {},
        input: obj,
        clone: clone,
        environment: environment,
        context: context
      };
      objScript.runInContext(vm.createContext(sandbox), {
        timeout: 500
      });
      rendered = sandbox.output;
    }
    catch (e) {
      debug(e);
      rendered = null;
    }
    return rendered;
  }
};
