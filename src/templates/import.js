'use strict';

var async = require('async');
var _ = require('lodash');
var Q = require('q');
var util = require('../util/util');
var debug = {
  template: require('debug')('formio:template:template'),
  _install: require('debug')('formio:template:_install')
};

/**
 * Perform an installation of a specified template.
 *
 * @param formio
 *   The formio object.
 */
module.exports = function(formio) {
  // Provide a default alter method.
  var _alter = function(item, done) {
    done(null, item);
  };

  // Assign the role ids.
  var assignRoles = function(template, perms) {
    _.each(perms, function(access) {
      _.each(access.roles, function(role, i) {
        if (template.roles.hasOwnProperty(role)) {
          access.roles[i] = template.roles[role]._id.toString();
        }
      });
    });
  };

  // Assign the role to an entity.
  var assignRole = function(template, entity) {
    if (entity.hasOwnProperty('role') && template.roles.hasOwnProperty(entity.role)) {
      entity.role = template.roles[entity.role]._id.toString();
    }
  };

  // Assign form.
  var assignForm = function(template, entity) {
    if (entity.hasOwnProperty('form')) {
      if (template.forms.hasOwnProperty(entity.form)) {
        entity.form = template.forms[entity.form]._id.toString();
      }
      if (template.resources.hasOwnProperty(entity.form)) {
        entity.form = template.resources[entity.form]._id.toString();
      }
    }
  };

  /**
   * Methods to fill in all necessary ID's.
   * @type {{role}}
   */
  var parse = {
    role: function(template, role) {
      return role;
    },
    form: function(template, form) {
      assignRoles(template, form.submissionAccess);
      assignRoles(template, form.access);
      util.eachComponent(form.components, function(component) {
        if (
          (component.type === 'resource') &&
          (template.resources.hasOwnProperty(component.resource))
        ) {
          component.resource = template.resources[component.resource]._id.toString();
        }
      });
      return form;
    },
    action: function(template, action) {
      assignForm(template, action);
      assignRole(template, action.settings);
      return action;
    },
    submission: function(template, submission) {
      assignForm(template, submission);
      return submission;
    }
  };

  // Install a model with a parse method.
  var _install = function(model, _parse, machineNameAlter) {
    return function(template, items, alter, done) {
      if (!items || _.isEmpty(items)) {
        return done();
      }

      // Normalize arguments.
      if (!done) {
        done = alter;
        alter = null;
      }
      alter = alter || _alter;
      async.forEachOfSeries(items, function(item, name, itemDone) {
        var document = _parse ? _parse(template, item) : item;
        document.machineName = name;
        alter(document, function(err, document) {
          if (err) { itemDone(err); }
          debug._install(document);
          model.findOne({machineName: document.machineName}, function(err, doc) {
            if (err) {
              debug._install(err);
              return itemDone(err);
            }
            if (!doc) {
              doc = new model(document);
            }
            else {
              _.assign(doc, document);
            }
            doc.save(function(err, result) {
              if (err) {
                debug._install(err);
                return itemDone(err);
              }

              debug._install(result);
              items[name] = result.toObject();
              itemDone();
            });
          });
        });
      }, done);
    };
  };

  /**
   * Return an easy way for someone to install a template.
   */
  return {
    createInstall: _install,
    parse: parse,
    roles: _install(formio.resources.role.model, parse.role),
    forms: _install(formio.resources.form.model, parse.form),
    actions: _install(formio.actions.model, parse.action),
    submissions: _install(formio.resources.submission.model, parse.submission),
    template: function(template, alter, done) {
      if (!done) {
        done = alter;
        alter = null;
      }
      alter = alter || {};
      async.series([
        async.apply(this.roles, template, template.roles, alter.role),
        async.apply(this.forms, template, template.resources, alter.form),
        async.apply(this.forms, template, template.forms, alter.form),
        async.apply(this.actions, template, template.actions, alter.action),
        async.apply(this.submissions, template, template.submissions, alter.submission)
      ], function(err) {
        if (err) {
          debug.template(err);
          return done(err);
        }

        done(null, template);
      });
    }
  };
};
