'use strict';

var angular = require('angular');
var _ = require('lodash');

require('../../../scss/jobs-list.scss');

module.exports = angular.module('jobs-list.directives',[
    require('../filters/pretty-stringify').name
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
    ])
    .directive('jobItem', [
       function() {
           return {
             restrict: 'E',
             scope: {
                 item:'='
             },
             template: require('../../../templates/job-item.html'),
             link:function($scope) {
                    $scope.open = false;

                    $scope.toggleOpenClose = function($event)
                    {
                        $event.stopPropagation();
                        $scope.open = !$scope.open;
                    }              
                    
                    $scope.title = function() {
                        return $scope.item.label  || ('Item #' + $scope.item._id);         
                    }   
                    
                    var kStatusClasses = {
                        0:'status-success',
                        1:'status-waiting',
                        2:'status-failure'
                    }
                    
                    $scope.statusClass = function() {
                       return kStatusClasses[$scope.item.status];
                    }
                    
                    $scope.toggleSelected = function($event) {
                        $event.stopPropagation();
                        $scope.selected = !$scope.selected;
                        $scope.$emit('jobItem.selectionChanged',$scope.item,$scope.selected);
                    }
             }  
           };
       } 
    ]);