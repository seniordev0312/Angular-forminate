'use strict';

var async = require('async');
var _ = require('lodash');
var Q = require('q');

/**
 * Update 3.0.5
 *
 * This update does the following.
 *
 *   1.) Finds all forms that have components with unique properties
 *   2.) Coerces all unique fields to be comparable
 *
 * @param db
 * @param config
 * @param tools
 * @param done
 */
module.exports = function(db, config, tools, done) {
  var formCollection = db.collection('forms');
  var submissionCollection = db.collection('submissions');

  // The list of fixed forms.
  var fixedForms = [];

  /**
   * Fix the submissions unique fields.
   *
   * @param submission
   * @param uniques
   * @param next
   * @returns {*}
   */
  var fixSubmissionUniques = function(submission, uniques, next) {
    var update = {};
    _.each(uniques, function(path, key) {
      var item = _.get(submission, 'data.' + path);
      if (item) {
        // Coerce all unique string fields to be lowercase.
        if (typeof item === 'string') {
          update['data.' + path] = item.toString().toLowerCase();
        }
        // Coerce all unique string fields in an array to be lowercase.
        else if (item instanceof Array && (item.length > 0) && (typeof item[0] === 'string')) {
          _.map(item, function(element) {
            return element.toString().toLowerCase();
          });

          // Coerce all unique string fields to be lowercase.
          update['data.' + path] = item;
        }
      }
    });

    if (Object.keys(update).length === 0) {
      return next();
    }

    submissionCollection.findOneAndUpdate(
      {_id: tools.util.idToBson(submission._id)},
      {$set: update},
      function(err) {
        if (err) {
          return next(err);
        }


        return next();
      }
    );
  };

  /**
   * Fix all the submissions of the given form, to have comparable unique fields.
   *
   * @param form
   * @param next
   */
  var fixFormUniques = function(form, next) {
    var uniques = {};

    async.waterfall([
      function buildUniqueComponentList(callback) {
        tools.util.eachComponent(form.components, function(component, path, cb) {
          // We only care about non-layout components.
          if (!_.get(component, 'key')) {
            return cb();
          }

          // We only care about unique components.
          if (_.get(component, 'unique') !== true) {
            return cb();
          }

          uniques[component.key] = path;
          cb();
        }, callback);
      },
      function getFormSubmissions(callback) {
        submissionCollection.find({form: tools.util.idToBson(form._id)})
          .snapshot(true)
          .toArray(function(err, submissions) {
            if (err) {
              return callback(err);
            }

            return callback(null, submissions);
          });
      },
      function fixEachSubmission(submissions, callback) {
        if (!submissions || submissions.length === 0) {
          return callback();
        }

        async.each(submissions, function(submission, cb) {
          fixSubmissionUniques(submission, uniques, cb);
        }, callback);
      }
    ],
    function(err) {
      if (err) {
        return next(err);
      }

      fixedForms.push(tools.util.idToBson(form._id));
      next();
    });
  };

  /**
   * Get all the forms with a unique component in its root components list.
   *
   * @param next
   */
  var getFormsWithUniqueComponents = function(next) {
    formCollection.find({
      components: {$elemMatch: {unique: true}}
    })
    .snapshot(true)
    .toArray(function(err, forms) {
      if (err) {
        return next(err);
      }

      return next(null, forms);
    });
  };

  /**
   * Get all the forms with a unique component within a layout component, that hasnt already been modified.
   *
   * @param next
   */
  var getFormsWithUniqueComponentsInLayoutComponents = function(next) {
    formCollection.find({
      _id: {$nin: fixedForms},
      $or: [
        {
          $and: [
            {components: {$elemMatch: {columns: {$exists: true}}}},
            {components: {$elemMatch: {columns: {$elemMatch: {unique: true}}}}}
          ]
        },
        {
          $and: [
            {components: {$elemMatch: {rows: {$exists: true}}}},
            {components: {$elemMatch: {rows: {$elemMatch: {unique: true}}}}}
          ]
        },
        {
          $and: [
            {components: {$elemMatch: {components: {$exists: true}}}},
            {components: {$elemMatch: {components: {$elemMatch: {unique: true}}}}}
          ]
        }
      ]
      })
      .snapshot(true)
      .toArray(function(err, forms) {
        if (err) {
          return next(err);
        }

        return next(null, forms);
      });
  };

  /**
   * Fix each of the given forms, before continuing
   *
   * @param forms
   * @param next
   * @returns {*}
   */
  var fixEachForm = function(forms, next) {
    if (!forms || forms.length === 0) {
      return callback();
    }

    async.each(forms, fixFormUniques, function(err) {
      if (err) {
        return next(err);
      }

      return next();
    });
  };

  async.waterfall([
    getFormsWithUniqueComponents,
    fixEachForm,
    getFormsWithUniqueComponentsInLayoutComponents,
    fixEachForm
  ], function(err) {
    if (err) {
      return done(err);
    }

    done();
  });
};
