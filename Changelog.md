# Change Log
All notable changes to this project will be documented in this file

The format is based on [Keep a Changelog](http://keepachangelog.com/)
and this project adheres to [Semantic Versioning](http://semver.org/).

## 1.18.10
### Added
 - Ability to modify the current form based on submission data before validation.
 - `start:dev` script for npm with Nodemon support.
### Fixed
 - An issue with custom validations with components within a datagrid were not working properly.
 - CSV export for Resource component and Select component with data source Resource / URL / JSON.

## 1.18.9
### Fixed
 - An issue where if you have clearOnHide not set, it would still clear out values for hidden fields.

## 1.18.6, 1.18.7, 1.18.8
### Fixed
 - Issue with unit tests from extended libraries that introduce new properties.

## 1.18.5
### Fixed
 - Issue with components still getting cleared even though clearOnHide is false.

## 1.18.4
### Added
 - The ability to import a custom project.json during installation.

### Fixed
 - Issue during installation where the paths would get all messed up.

## 1.18.3
### Added
 - The ability to provide "full=true" query parameter to the form load and retrieve the full form, including form components.

## 1.18.2
### Fixed
 - The possibility of the server crashing for reference fields.

## 1.18.1
### Fixed
 - The body limit for form sizes to allow forms up to 16mb in size (JSON format).

## 1.18.0
### Added
 - Method for having reference field types that can dynamically link to sub resources.

### Fixed
 - Deprecated validation handler in the Roles model.
 - 'Unknown resource' error on PUT of form which has multiple save actions to other resources

## 1.17.6
### Changed
 - Submission Resource Access are calculated on the server during submission instead of in the browser.

### Added
 - Allow roles to have their own permissions apart from default owner permissions.

## 1.17.5
### Fixed
 - Make sure to not run the temp token tests for customer docker deployment test runs.

## 1.17.4
### Added
 - A tempToken hook system to allow external libraries to modify temp token payloads.

## 1.17.3
### Fixed
 - The way that the debug flag was being checked for debugging purposes.

## 1.17.2
### Added
 - Allow exported action machine names to be altered.

### Fixed
 - Fixed debugger issues with the email threads, due to an issue with process forking using the parent process.
 - Automatic generation of action machine names to be form:action.
 - Don't attempt to set headers after response has been sent.

## 1.17.1
### Added
 - Allow template export steps to be altered with templateExportSteps
 - Allow default template to be modified.

### Changed
 - Change templateSteps to templateImportSteps
 - Updating the default template for new email actions to use the submission macro, rather than email, to change the
   output of signature components to be Yes/No

### Reverted
 - Revert project version back to 2.0.0 and use tag instead.

## 1.17.0
???

## 1.16.7
### Added
 - Adding entity query hooks to the import entities.

## 1.16.6
### Changed
 - Changed export filename to include version.
 - Changed export version to reference project version not export schema.

### Removed
 - Removed plan from export.

## 1.16.5
### Added
 - Template import / export tests
 - git pre commit hooks for linting
 - External token hooks

### Fixed
 - Template action imports could fail based on resources not existing at creation time.
 - customPrivate validations now work for components nested inside of layout components.

### Removed
 - Removed old template schema translations on import.

## 1.16.4
### Added
 - Added temporary auth token support. You can now generate new tokens using the
   /token endpoint with the following headers.
    - x-expire = The expiration of the token in seconds.
    - x-allow = The paths to allow for the token in the format: GET:/path/[0-9a-z]+

## 1.16.3
### Added
 - Make action handlers alterable.
 - Add mongo indices to all entities.
