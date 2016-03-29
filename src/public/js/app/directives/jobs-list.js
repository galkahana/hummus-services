'use strict';

var angular = require('angular');
var _ = require('lodash');

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
             template: require('../../../templates/jobs-list.html'),
             link:function($scope) {
                 $scope.selectedElements = [];
                 
                 $scope.$on('jobItem.selectionChanged',function($event,item,selected) {
                     if(selected) 
                        $scope.selectedElements =  $scope.selectedElements.concat(item);
                     else
                        $scope.selectedElements =  _.without($scope.selectedElements, item);
                     console.log('selected',$scope.selectedElements.length,'items');
                 });
                 
             }  
           };
       } 
    ]);