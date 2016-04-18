'use strict';

require('bootstrap-webpack'); // load bootstrap
require('../../../scss/app.scss'); // app css

appController.$inject =['$scope'];

function appController($scope) {
    
    $scope.waiting = 0;
    
    $scope.$on('loginController.loginStarts',function() {
        ++$scope.waiting;
    });

    $scope.$on('loginController.loginEnds',function() {
        --$scope.waiting;
    });

    $scope.$on('authorization.authorizationStarts',function() {
        ++$scope.waiting;
    });

    $scope.$on('authorization.authorizationEnds',function() {
        --$scope.waiting;
    });

}

module.exports = appController;