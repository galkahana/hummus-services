'use strict';

var angular = require('angular');

require('../../../scss/console-footer.scss');

module.exports = angular.module('console-footer.directives',[])
    .directive('consoleFooter', [
       function() {
           return {
             restrict: 'E',
             template: require('../../../templates/console-footer.html'),
             link:function($scope) {
                 
             }  
           };
       } 
    ]);