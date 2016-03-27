'use strict';

var angular = require('angular');

module.exports = angular.module('pretty-stringify.filters', [])
    .filter('prettyStringify', function () {
        return function (input) {
            return JSON.stringify(input,null,'\t');
        };
    });

