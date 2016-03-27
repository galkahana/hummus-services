'use strict';

var angular = require('angular');

require('../../../scss/app-header.scss');

module.exports = angular.module('app-header.directives',[])
    .directive('appHeader', [
       function() {
           return {
             restrict: 'E',
             template: require('../../../templates/app-header.html'),
             link:function($scope) {
                 
             }  
           };
       } 
    ]);