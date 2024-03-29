'use strict';

require('../../../scss/jobs-page.scss'); // app css
require('toastr/build/toastr.css');

var _ = require('lodash'),
    toastr = require('toastr'),
    moment = require('moment');
    
    toastr.options = {timeOut:'2000'};

jobsController.$inject = ['$scope','$timeout','$document','GenerationJob','ModalAlert','Constants'];

function jobsController($scope,$timeout,$document,GenerationJob,ModalAlert,Constants) {
    
    
    $scope.searchTerm = null;
    $scope.searchActive = false;

    var to = moment().endOf('day');
    var from = moment(to).subtract(1,'month'); 

    $scope.dateFilter = from.format(Constants.DEFAULT_DATE_FILTER) + 
                            ' - ' +  
                            to.format(Constants.DEFAULT_DATE_FILTER);
    
    function loadData(cb) {
    
        // reset selected elements
        $scope.selectedElements = [];
    
        var params = {};
        
        if($scope.searchActive) {
            params.searchTerm = $scope.searchTerm;
        }
        
        if($scope.dateFilter) {
            var dates = $scope.dateFilter.split('-');
            if(dates.length == 2) {
                params.dateRangeFrom =  moment(dates[0],Constants.DEFAULT_DATE_FILTER).toDate();
                params.dateRangeTo = moment(dates[1],Constants.DEFAULT_DATE_FILTER).add(1, 'days').toDate();
            }
        }
        
        GenerationJob.query(params).then(function(response) {
            $scope.jobs = response.data;
            trackJobsInProgress();
            if(cb)
                cb();
        },
        function(err) {
            console.log('error!',err);
            if(cb)
                cb(err);
        });
    }

    // refresh
    $scope.refresh = function() {
        $scope.refreshing = 2;
        loadData(function(){
            --$scope.refreshing;
        });
        // give us at least half a spin, so ppl know something was happening
        $timeout(function() {
            --$scope.refreshing;            
        },500);
    };
    
    // search
    $scope.cancelSearch = function() {
        $scope.searching = true;
        $scope.searchActive = false;
        $scope.searchTerm = null;
        loadData(function() {
            $scope.searching = false;
        });
        
    }
    
    $scope.submitSearch = function() {
        if(!$scope.searchTerm) {
            if($scope.searchActive)
                $scope.cancelSearch();
            return;
        }
        
        $scope.searching = true;
        $scope.searchActive = true;
        loadData(function() {
            $scope.searching = false;
        });
    }
    
    // idle change behavior - go for search automatically if waiting for change
    var idleSearchLoadTimeout = null;
    $scope.changingSearch = function() {
        if(idleSearchLoadTimeout)
           $timeout.cancel(idleSearchLoadTimeout);
        idleSearchLoadTimeout = $timeout(function() {
            $scope.submitSearch();
        },500);
    }
    
    // selection handling
    $scope.$on('jobItem.selectionChanged',function($event,item,selected) {
        if(selected) 
            $scope.selectedElements =  $scope.selectedElements.concat(item);
        else
            $scope.selectedElements =  _.without($scope.selectedElements, item);
    });

    $scope.deselectAll = function() {
        $scope.$broadcast('jobItem.selectionChanged.external',$scope.selectedElements,false);
        $scope.selectedElements = [];
    }
    
    function selectionListToIDs() {
        return _.map($scope.selectedElements,function(value){return value._id});
    }
    
    // deleting jobs
    $scope.deleting = false;
    $scope.delete = function() {
        if($scope.deleting)
            return;
            
        var mults = ($scope.selectedElements.length == 1 ? '':'s');
            
        ModalAlert.open('Warning',
            'You are about to *permanenetly* delete the selected Job' +
            mults + 
            '. This action cannot be undone.\n\nAre you sure that you want to continue?',
            {
                confirm:'Yes',
                reject:'No'
            },function(result) {
                if(!result)
                    return;
        
                $scope.deleting = true;
                
                GenerationJob.deleteMultiple(selectionListToIDs()).then(function(response) {
                    $scope.jobs = _.difference($scope.jobs,$scope.selectedElements);
                    $scope.selectedElements = [];
                    $scope.deleting = false;
                    toastr.success('Job' + mults + ' succesfully deleted');
                },
                function(err) {
                    toastr.error('Failed to delete Job' + mults);
                    console.log('error!',err);
                    $scope.deleting = false;
                });
            });        
    }
    
    // deleting files
    $scope.deletingFiles = false;
    $scope.doneDeletingFiles = false;
    $scope.deleteFiles = function() {
        if($scope.deletingFiles)
            return;
        
        var mults = ($scope.selectedElements.length == 1 ? '':'s');
        
        ModalAlert.open('Warning',
            'You are about to *permanenetly* delete PDF file' + mults + ' selected Job' + mults + 
            '. This action cannot be undone.\n\nAre you sure that you want to continue?',
            {
                confirm:'Yes',
                reject:'No'
            },function(result) {
                if(!result)
                    return;

                $scope.deletingFiles = true;
                $scope.doneDeletingFiles = false;
                
                GenerationJob.deleteMultipleFiles(selectionListToIDs()).then(function(response) {
                    $scope.selectedElements.forEach(function(value) {
                        value.generatedFile = null;
                    });
                    $scope.doneDeletingFiles = true;
                    $timeout(function(){
                        // extra OK mark for 1/2 second to show that all was done well
                        $scope.deletingFiles = false;
                    },500);
                },
                function(err) {
                    toastr.error('Failed to delete files' + mults + ' for selected job' + mults);
                    $scope.deletingFiles = false;
                });
            });     
    }
    
    // automatically tracking status for jobs in progress
    var trackingTimeout = null;
    function trackJobsInProgress() {
        if(trackingTimeout)
            $timeout.cancel(trackingTimeout);
        trackingTimeout = $timeout(loadJobsInProgressStatus,3000);
    }
    
    function loadJobsInProgressStatus() {
        if(!$scope.jobs)
            return;
        var jobsInProgress = _.filter($scope.jobs,function(value){
                                return value.status == Constants.eJobInProgress;});
        var jobsInProgressIDs = _.map(jobsInProgress,function(value){return value._id});
        
        if(jobsInProgressIDs.length > 0) {
            GenerationJob.query({in:jobsInProgressIDs}).then(function(response) {
                var hasJobsStillInProgress = false;
                
                response.data.forEach(function(value) {
                    var jobHere = _.find(jobsInProgress,{_id:value._id});
                    if(jobHere) {
                        // update only those fields related to job status that may change
                        jobHere.status = value.status;
                        jobHere.generatedFile = value.generatedFile;
                        jobHere.updatedAt = value.updatedAt;
                        // if new status is still in progress mark that there's still what to query
                        if(jobHere.status == Constants.eJobInProgress) {
                            hasJobsStillInProgress = true;
                        }
                    }
                });

                // if there are still jobs that are in progress run tracking again
                if(hasJobsStillInProgress)
                    trackJobsInProgress();
            },
            function(err) {
                console.log('error!',err);
            });
        }
        
    }
    
    // date filter
    $scope.$watch('dateFilter',function(value,oldValue) {
        if(!value && !oldValue)
            return; // init, forget it
        loadData();
    });
    
    $scope.openDateDialog = function($event) {
        $event.currentTarget.parentElement.querySelector('.date-filter-text>input').click()
    }
        
    // load the window data
    $scope.refreshing = 1;
    loadData(function(){
        --$scope.refreshing;
    });
    
    /*
        toolbar && scroll behavior
    */
    var DOWN_THRESHOLD = 100;
    
    $scope.detachToolbar = false;
    
    $document.on('scroll',function() {
        if(!$scope.detachToolbar) {
            if(document.body.scrollTop > 
                document.querySelector('jobs-list').offsetTop + 
                DOWN_THRESHOLD) {
                    $scope.$apply(function() {
                        $scope.detachToolbar = true;
                    });
            }
        } else {
            if(document.body.scrollTop <= 
                document.querySelector('jobs-list').offsetTop +
                DOWN_THRESHOLD) {
                    $scope.$apply(function() {
                        $scope.detachToolbar = false;
                    });
                    
                } 
        }
    });
    $scope.$on('$destroy',function() {
        $document.off('scroll');
    });
}

module.exports = jobsController;