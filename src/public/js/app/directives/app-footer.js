'use strict';

var angular = require('angular');

require('../../../scss/app-footer.scss');

module.exports = angular.module('app-footer.directives',[])
    .directive('appFooter', [
       function() {
           return {
             restrict: 'E',
             template: require('../../../templates/app-footer.html'),
             link:function($scope) {
                 
             }  
           };
       } 
    ]);