'use strict';

var angular = require('angular');

require('../../../scss/jobs-list.scss');

module.exports = angular.module('jobs-list.directives',[
    require('./job-item').name
])
    .directive('jobsList', [
       function() {
           return {
             restrict: 'E',
             scope: {
                 items:'='
             },
             template: require('../../../templates/jobs-list.html')
           };
       } 
    ]);