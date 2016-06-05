'use strict';

require('bootstrap-webpack'); // load bootstrap
require('../../../scss/welcome-page.scss');

welcomeBaseController.$inject = ['$scope','$interval','Accounting'];

function welcomeBaseController($scope,$interval,Accounting) {
    
    function updateCount() {
        Accounting.getTotalJobs().then(function(response) {
            $scope.count = response.data.count;
        });
    }
    
    updateCount();
    var stopInterval = $interval(updateCount,5000);
    $scope.$on('$destroy', function() {
        $interval.cancel(stopInterval);
    });
    
}

module.exports = welcomeBaseController;