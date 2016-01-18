'use strict';

module.exports = function(router) {
  return {
    alias: require('./alias')(router),
    params: require('./params')(router),
    bootstrapEntityOwner: require('./bootstrapEntityOwner')(router),
    bootstrapFormAccess: require('./bootstrapFormAccess')(router),
    bootstrapNewRoleAccess: require('./bootstrapNewRoleAccess')(router),
    condensePermissionTypes: require('./condensePermissionTypes')(router),
    filterMongooseExists: require('./filterMongooseExists')(router),
    filterResourcejsResponse: require('./filterResourcejsResponse')(router),
    filterSubmissionAccess: require('./filterSubmissionAccess')(router),
    filterProtectedFields: require('./filterProtectedFields')(router),
    deleteActionHandler: require('./deleteActionHandler')(router),
    deleteFormHandler: require('./deleteFormHandler')(router),
    deleteRoleHandler: require('./deleteRoleHandler')(router),
    deleteSubmissionHandler: require('./deleteSubmissionHandler')(router),
    formHandler: require('./formHandler')(router),
    formActionHandler: require('./formActionHandler')(router),
    ownerFilter: require('./ownerFilter')(router),
    permissionHandler: require('./permissionHandler')(router),
    setFilterQueryTypes: require('./setFilterQueryTypes')(router),
    sortMongooseQuery: require('./sortMongooseQuery')(router),
    submissionHandler: require('./submissionHandler')(router),
    tokenHandler: require('./tokenHandler')(router)
  };
};
