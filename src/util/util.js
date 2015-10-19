'use strict';

var mongoose = require('mongoose');
var _ = require('lodash');
var nodeUrl = require('url');
var Q = require('q');
var debug = {
  getUrlParams: require('debug')('formio:util:getUrlParams')
};

module.exports = {

  /**
   * Establish an external API to help external libraries.
   *
   * @param router
   */
  api: function(formio) {
  },

  /**
   * Returns the URL alias for a form provided the url.
   */
  getAlias: function(req, reservedForms) {
    var formsRegEx = new RegExp('\/(' + reservedForms.join('|') + ').*', 'i');
    var alias = req.url.substr(1).replace(formsRegEx, '');
    var additional = req.url.substr(alias.length + 1);
    if (!additional && req.method === 'POST') {
      additional = '/submission';
    }
    return {
      alias: alias,
      additional: additional
    };
  },

  /**
   * Create a sub-request object from the original request.
   *
   * @param req
   */
  createSubRequest: function(req) {
    // Save off formio for fast cloning...
    var cache = req.formioCache;
    delete req.formioCache;

    // Clone the request.
    var childReq = _.clone(req, true);

    // Add the parameters back.
    childReq.formioCache = cache;
    childReq.user = req.user;
    childReq.modelQuery = null;
    childReq.countQuery = null;

    // Delete default resourceData from actions
    // otherwise you get an endless loop
    delete childReq.resourceData;

    // Delete skipResource so child requests can decide
    // this for themselves
    delete childReq.skipResource;

    return childReq;
  },

  /**
   * Iterate through each component within a form.
   * @param components
   * @param eachComp
   */
  eachComponent: function eachComponent(components, eachComp) {
    _.each(components, function(component) {
      if (component.columns && (component.columns.length > 0)) {
        _.each(component.columns, function(column) {
          eachComponent(column.components, eachComp);
        });
      }
      else if (component.components && (component.components.length > 0)) {
        eachComponent(component.components, eachComp);
      }
      else {
        eachComp(component);
      }
    });
  },

  /**
   * Flatten the form components for data manipulation.
   * @param components
   * @param flattened
   * @returns {*|{}}
   */
  flattenComponents: function flatten(components) {
    var flattened = {};
    this.eachComponent(components, function(component) {
      flattened[component.key] = component;
    });
    return flattened;
  },

  /**
   * Return the objectId.
   *
   * @param id
   * @returns {*}
   * @constructor
   */
  ObjectId: function(id) {
    return _.isObject(id)
      ? id
      : mongoose.Types.ObjectId(id);
  },

  /**
   * Search the request headers for the given key.
   *
   * @param req
   *   The Express request object.
   * @param key
   *   The key to search for in the headers.
   *
   * @return
   *   The header value if found or false.
   */
  getHeader: function(req, key) {
    if (typeof req.headers[key] !== 'undefined') {
      return req.headers[key];
    }

    return false;
  },

  /**
   * Search the request query for the given key.
   *
   * @param req
   *   The Express request object.
   * @param key
   *   The key to search for in the query.
   *
   * @return
   *   The query value if found or false.
   */
  getQuery: function(req, key) {
    if (typeof req.query[key] !== 'undefined') {
      return req.query[key];
    }

    return false;
  },

  /**
   * Search the request parameters for the given key.
   *
   * @param req
   *   The Express request object.
   * @param key
   *   The key to search for in the parameters.
   *
   * @return
   *   The parameter value if found or false.
   */
  getParameter: function(req, key) {
    if (typeof req.params[key] !== 'undefined') {
      return req.params[key];
    }

    return false;
  },

  /**
   * Determine if the request has the given key set as a header or url parameter.
   *
   * @param req
   *   The Express request object.
   * @param key
   *   The key to search for.
   *
   * @return
   *   Return the value of the key or false if not found.
   */
  getRequestValue: function(req, key) {
    var ret = null;

    // If the header is present, return it.
    ret = this.getHeader(req, key);
    if (ret !== false) {
      return ret;
    }

    // If the url query is present, return it.
    ret = this.getQuery(req, key);
    if (ret !== false) {
      return ret;
    }

    // If the url parameter is present, return it.
    ret = this.getParameter(req, key);
    if (ret !== false) {
      return ret;
    }

    return false;
  },

  /**
   * Split the given URL into its key/value pairs.
   *
   * @param url
   *   The request url to split, typically req.url.
   *
   * @returns {{}}
   *   The key/value pairs of the request url.
   */
  getUrlParams: function(url) {
    var urlParams = {};
    if (!url) {
      return urlParams;
    }
    var parsed = nodeUrl.parse(url);
    var parts = parsed.pathname.split('/');
    debug.getUrlParams(parsed);

    // Remove element originating from first slash.
    parts = _.rest(parts);

    // Url is not symmetric, add an empty value for the last key.
    if ((parts.length % 2) !== 0) {
      parts.push('');
    }

    // Build key/value list.
    for (var a = 0; a < parts.length; a += 2) {
      urlParams[parts[a]] = parts[a + 1];
    }

    debug.getUrlParams(urlParams);
    return urlParams;
  },

  /**
   * Converts a form component key into a submission key
   * by putting .data. between each nested component
   * (ex: `user.name` becomes `user.data.name` in a submission)
   * @param key
   *   The key to convert
   * @return
   *   The submission key
   */
  getSubmissionKey: function(key) {
    return key.replace(/\./g, '.data.');
  }
};
