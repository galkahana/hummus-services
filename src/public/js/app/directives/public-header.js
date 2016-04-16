'use strict';

var angular = require('angular');

require('../../../scss/public-header.scss');

module.exports = angular.module('public-header.directives',[
])
    .directive('publicHeader', [
       function() {
           return {
             restrict: 'E',
             template: require('../../../templates/public-header.html'),
             link:function($scope) {
             }  
           };
       } 
    ]);