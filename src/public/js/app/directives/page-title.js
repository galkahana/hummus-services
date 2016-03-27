'use strict';

var angular = require('angular');

require('../../../scss/page-title.scss');

module.exports = angular.module('page-title.directives',[])
    .directive('pageTitle', ['$state',
       function($state) {
           return {
             restrict: 'E',
             template: require('../../../templates/page-title.html'),
             link:function($scope) {
                 $scope.getStateData = function() {
                     return $state.current.data;
                 }
             }  
           };
       } 
    ]);