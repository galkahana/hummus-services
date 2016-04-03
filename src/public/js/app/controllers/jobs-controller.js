'use strict';

require('../../../scss/jobs-page.scss'); // app css

jobsController.$inject = ['$scope','$timeout','GenerationJob'];

function jobsController($scope,$timeout,GenerationJob) {
    
    $scope.searchTerm = null;
    $scope.searchActive = false;
    
    function loadData(cb) {
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
    
    loadData();
}

module.exports = jobsController;