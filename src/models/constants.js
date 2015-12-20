var constants = {};

// generated files types
constants.eSourceLocal = 0;
constants.eSourceS3 = 1;
constants.ESourceTypes = [constants.eSourceLocal,constants.eSourceS3];

// generated job statuses
constants.eJobDone = 0;
constants.eJobInProgress = 1;
constants.eJobFailed = 2;
constants.EJobStatuses = [constants.eJobDone,constants.eJobInProgress,constants.eJobFailed];


module.exports = constants;