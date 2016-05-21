'use strict';

var angular = require('angular'),
    moment = require('moment');

module.exports = angular.module('moment-formatter.filters', [])
    .filter('momentFormatter', function() {
	return function(date, format) {
		return moment(date).format(format);
	}
});