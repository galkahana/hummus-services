'use strict';

var angular = require('angular');
var _ = require('lodash'),
    toastr = require('toastr');

require('../../../scss/job-item.scss');
    
toastr.options = {timeOut:'2000'};

module.exports = angular.module('job-item.directives',[
    require('../filters/pretty-stringify').name,
    require('../services/constants').name,
    require('../services/generated-files').name,
    require('../services/modal-alert').name
])
    .directive('jobItem', ['$filter','Constants','GeneratedFiles','ModalAlert','AuthenticationInterceptor',
       function($filter,Constants,GeneratedFiles,ModalAlert,AuthenticationInterceptor) {
           return {
             restrict: 'E',
             scope: {
                 item:'='
             },
             template: require('../../../templates/job-item.html'),
             link:function($scope,element) {
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
                        return Constants.DEFAULT_DATE_TIME_FILTER;
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
                        return AuthenticationInterceptor.idUrl('__apiURL__/generated-files/' + $scope.item.generatedFile.toString() + '/download');
                    }
                    
                    $scope.statusText = function() {
                        return Constants.EStatusTexts[$scope.item.status];
                    }
                    
                    $scope.toggleSelected = function($event) {
                        $event.stopPropagation();
                        $scope.selected = !$scope.selected;
                        $scope.$emit('jobItem.selectionChanged',$scope.item,$scope.selected);
                    }

                    $scope.$on('jobItem.selectionChanged.external',function(event,items,selection) {
                        if($scope.selected !== selection &&
                            _.indexOf(items, $scope.item) !== -1)
                            $scope.selected = selection;
                    });
                    
                    $scope.$watch('item.status',function(newValue,oldValue) {
                        if(oldValue == Constants.eJobInProgress) {
                            if(newValue == Constants.eJobDone)
                                element[0].querySelector('.item-title .status').className+= ' waiting-to-success';
                            else if(newValue == Constants.eJobFailed)
                                element[0].querySelector('.item-title .status').className+= ' waiting-to-error';
                        }
                    });

                    
                    $scope.waitingForDelete = false;
                    $scope.removeFile = function() {
                        if($scope.waitingForDelete)
                            return;
                            
                        ModalAlert.open('Warning',
                            'You are about to permanently delete the file for this job. This action **may not** be undone. You good with that?',
                            {
                                confirm:'Sure',
                                reject:'Nope'
                            },function(result) {
                                if(!result)
                                    return;
                                    
                                $scope.waitingForDelete = true;
                                    
                                GeneratedFiles.delete($scope.item.generatedFile).then(function(response) {
                                    $scope.item.generatedFile = null; // Done!
                                    $scope.waitingForDelete = false;
                                    toastr.success('File delete successful');
                                },function(err) {
                                    toastr.error('Failed to delete file');
                                    console.log(err);
                                    $scope.waitingForDelete = false;
                                });
                            })
                    }
             }  
           };
       } 
    ]);