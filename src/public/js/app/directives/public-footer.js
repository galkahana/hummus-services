'use strict';

var angular = require('angular');

require('../../../scss/public-footer.scss');

module.exports = angular.module('public-footer.directives',[])
    .directive('publicFooter', [
       function() {
           return {
             restrict: 'E',
             template: require('../../../templates/public-footer.html'),
             link:function($scope) {
                 
             }  
           };
       } 
    ]);