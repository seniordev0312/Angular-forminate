module.exports = function(formio) {
  return {
    settings: function(req, cb) {
      var settings = formio.config.settings || {};
      if (formio.hooks && formio.hooks.settings) {
        return formio.hooks.settings(settings, req, cb);
      }

      // Load the settings directly.
      cb(null, settings);
    },
    invoke: function() {
      var name = arguments[0];
      if (
        formio.hooks &&
        formio.hooks.on &&
        formio.hooks.on[name]
      ) {
        var retVal = formio.hooks.on[name].apply(this, Array.prototype.slice.call(arguments, 1));
        return (retVal !== undefined) ? !!retVal : true;
      }
      return false;
    },
    alter: function () {
      var name = arguments[0];
      if (
        formio.hooks &&
        formio.hooks.alter &&
        formio.hooks.alter[name]
      ) {
        return formio.hooks.alter[name].apply(this, Array.prototype.slice.call(arguments, 1));
      }
      return arguments[1];
    }
  };
};
