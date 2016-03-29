'use strict';

var angular = require('angular');
var _ = require('lodash');

require('../../../scss/job-item.scss');

module.exports = angular.module('job-item.directives',[
    require('../filters/pretty-stringify').name,
    require('../services/constants').name,
    require('../services/generated-files').name
])
    .directive('jobItem', ['$filter','Constants','GeneratedFiles',
       function($filter,Constants,GeneratedFiles) {
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
                    
                    var kStatusClasses =_.zipObject(
                                            Constants.EJobStatuses,
                                            [                       
                                                'status-success',
                                                'status-waiting',
                                                'status-failure'
                                            ]); 
                    
                    $scope.statusClass = function() {
                       return kStatusClasses[$scope.item.status];
                    }
                    
                    $scope.defaultDateFilter = function(){
                        return Constants.DEFAULT_DATE_FILTER;
                    }
                    
                    $scope.finishedText = function() {
                        if($scope.item.status == Constants.eJobDone ||
                            $scope.item.status == Constants.eJobFailed)
                            return $filter('date')($scope.item.updatedAt,$scope.defaultDateFilter());
                        else   
                            return 'N/A';
                    }
                    
                    $scope.hasReadyFile = function() {
                        return $scope.item.generatedFile && $scope.item.status == Constants.eJobDone;                       
                    }
                    
                    $scope.downloadURL = function() {
                        return '__apiURL__/generated-files/' + $scope.item.generatedFile.toString();
                    }
                    
                    $scope.statusText = function() {
                        return Constants.EStatusTexts[$scope.item.status];
                    }
                    
                    $scope.toggleSelected = function($event) {
                        $event.stopPropagation();
                        $scope.selected = !$scope.selected;
                        $scope.$emit('jobItem.selectionChanged',$scope.item,$scope.selected);
                    }
                    
                    $scope.waitingForDelete = false;
                    $scope.removeFile = function() {
                        if($scope.waitingForDelete)
                            return;
                        
                        $scope.waitingForDelete = true;
                            
                        GeneratedFiles.delete($scope.item.generatedFile).then(function(response) {
                            $scope.item.generatedFile = null; // Done!
                            $scope.waitingForDelete = false;
                        },function(err) {
                            console.log(err);
                            $scope.waitingForDelete = false;
                        });
                        
                    }
             }  
           };
       } 
    ]);