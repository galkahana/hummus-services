'use strict';

require('../../../scss/jobs-page.scss'); // app css
var _ = require('lodash');

jobsController.$inject = ['$scope','$timeout','GenerationJob'];

function jobsController($scope,$timeout,GenerationJob) {
    
    $scope.searchTerm = null;
    $scope.searchActive = false;
    
    function loadData(cb) {
    
        // reset selected elements
        $scope.selectedElements = [];
    
        var params = {};
        
        if($scope.searchActive) {
            params.searchTerm = $scope.searchTerm;
        }
        
        GenerationJob.query(params).then(function(response) {
            $scope.jobs = response.data;
            if(cb)
                cb();
        },
        function(err) {
            console.log('error!',err);
            if(cb)
                cb(err);
        });
    }

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
    var theTimeout = null;
    $scope.changingSearch = function() {
        if(theTimeout)
           $timeout.cancel(theTimeout);
        theTimeout = $timeout(function() {
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
    
    // deleting
    $scope.deleting = false;
    $scope.delete = function() {
        if($scope.deleting)
            return;
        
        $scope.deleting = true;
        
        GenerationJob.deleteMultiple($scope.selectedElements).then(function(response) {
            $scope.jobs = _.difference($scope.jobs,$scope.selectedElements);
            $scope.selectedElements = [];
            $scope.deleting = false;
        },
        function(err) {
            console.log('error!',err);
            $scope.deleting = false;
        });        
    }
    
    // deleting files
    $scope.deletingFiles = false;
    $scope.doneDeletingFiles = false;
    $scope.deleteFiles = function() {
        if($scope.deletingFiles)
            return;
        
        $scope.deletingFiles = true;
        
        GenerationJob.deleteMultipleFiles($scope.selectedElements).then(function(response) {
            $scope.selectedElements.forEach(function(value) {
                value.generatedFile = null;
            });
            $scope.doneDeletingFiles = true;
            $timeout(function(){
                // extra OK mark for 1/2 second to show that all was done well
                $scope.doneDeletingFiles = false;
                $scope.deletingFiles = false;
            },500);
        },
        function(err) {
            console.log('error!',err);
            $scope.deletingFiles = false;
        });        
    }
        
    loadData();
}

module.exports = jobsController;