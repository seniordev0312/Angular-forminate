'use strict';

var Resource = require('resourcejs');
var mongoose = require('mongoose');
var utils = require('formio-utils');
var _ = require('lodash');

module.exports = function(router) {
  var hook = require('../util/hook')(router.formio);
  var handlers = router.formio.middleware.submissionHandler;
  var hiddenFields = ['deleted', '__v', 'machineName'];

  // Manually update the handlers, to add additional middleware.
  handlers.beforePost = [
    router.formio.middleware.filterMongooseExists({field: 'deleted', isNull: true}),
    router.formio.middleware.bootstrapEntityOwner(true),
    router.formio.middleware.bootstrapSubmissionAccess,
    router.formio.middleware.condenseSubmissionPermissionTypes,
    handlers.beforePost
  ];
  handlers.afterPost = [
    handlers.afterPost,
    router.formio.middleware.filterResourcejsResponse(hiddenFields),
    router.formio.middleware.filterProtectedFields
  ];
  handlers.beforeGet = [
    router.formio.middleware.filterMongooseExists({field: 'deleted', isNull: true}),
    handlers.beforeGet
  ];
  handlers.afterGet = [
    handlers.afterGet,
    router.formio.middleware.filterResourcejsResponse(hiddenFields),
    router.formio.middleware.filterProtectedFields
  ];
  handlers.beforePut = [
    router.formio.middleware.filterMongooseExists({field: 'deleted', isNull: true}),
    router.formio.middleware.bootstrapEntityOwner(false),
    router.formio.middleware.bootstrapSubmissionAccess,
    router.formio.middleware.condenseSubmissionPermissionTypes,
    handlers.beforePut
  ];
  handlers.afterPut = [
    handlers.afterPut,
    router.formio.middleware.filterResourcejsResponse(hiddenFields),
    router.formio.middleware.filterProtectedFields
  ];
  handlers.beforeIndex = [
    router.formio.middleware.setFilterQueryTypes,
    router.formio.middleware.filterMongooseExists({field: 'deleted', isNull: true}),
    router.formio.middleware.ownerFilter,
    router.formio.middleware.submissionResourceAccessFilter,
    handlers.beforeIndex
  ];
  handlers.afterIndex = [
    handlers.afterIndex,
    router.formio.middleware.filterResourcejsResponse(hiddenFields),
    router.formio.middleware.filterProtectedFields
  ];
  handlers.beforeDelete = [
    router.formio.middleware.filterMongooseExists({field: 'deleted', isNull: true}),
    handlers.beforeDelete,
    router.formio.middleware.deleteSubmissionHandler
  ];
  handlers.afterDelete = [
    handlers.afterDelete,
    router.formio.middleware.filterResourcejsResponse(hiddenFields),
    router.formio.middleware.filterProtectedFields
  ];

  // Register an exists endpoint to see if a submission exists.
  router.get('/form/:formId/exists', function(req, res, next) {
    // First load the form.
    router.formio.cache.loadCurrentForm(req, function(err, form) {
      if (err) {
        return next(err);
      }

      // Start the query.
      var query = {
        form: form._id
      };

      // Allow them to provide the owner flag.
      if (req.query.owner) {
        query.owner = req.query.owner;
      }

      utils.eachComponent(form.components, function(component) {
        // Only add components that are not protected and are persistent.
        if (
          req.query.hasOwnProperty('data.' + component.key) &&
          !component.protected &&
          (!component.hasOwnProperty('persistent') || component.persistent)
        ) {
          if (!query.data) {
            query.data = {};
          }

          // Add this to the query data.
          query.data[component.key] = req.query['data.' + component.key];
        }
      })

      // Query the submissions for this submission.
      router.formio.resources.submission.model.findOne(query, function(err, submission) {
        if (err) {
          return next(err);
        }

        // Return not found.
        if (!submission || !submission._id) {
          return res.status(404).send('Not found');
        }

        // Send only the id as a response if the submission exists.
        return res.status(200).json({
          _id: submission._id.toString()
        });
      });
    });
  });

  return Resource(
    router,
    '/form/:formId',
    'submission',
    mongoose.model('submission', router.formio.schemas.submission)
  ).rest(hook.alter('submissionRoutes', handlers));
};
