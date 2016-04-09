'use strict';
var angular = require('angular');

var constants = {};

// generated job statuses
constants.eJobDone = 0;
constants.eJobInProgress = 1;
constants.eJobFailed = 2;
constants.EJobStatuses = [constants.eJobDone,constants.eJobInProgress,constants.eJobFailed];
constants.EStatusTexts = ['Done','In Progress','Failed'];


// others

constants.DEFAULT_DATE_TIME_FILTER  = 'MMM d, y hh:mm:ss:sss\'ms\'';
constants.DEFAULT_DATE_FILTER  = 'MMM DD, YYYY';

module.exports = angular.module('constants.services', [])
    .factory('Constants', [
        function() {

            return constants;
        }
    ]);