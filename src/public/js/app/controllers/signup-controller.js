'use strict';

require('../../../scss/public-base.scss');
require('../../../scss/signup-page.scss'); 


signupController.$inject = ['$scope','$state','$rootScope','$cookies','principal','authentication'];

function signupController($scope,$state,$rootScope,$cookies,principal,authentication) {
    $scope.error = null;
    $scope.account = {};
    
    $scope.signup = function(signupForm){
        $scope.error = null;

        if(!signupForm.$valid ||
                $scope.account.password !== $scope.account.repeatPassword ||
                $scope.waitingForComplete) {
                return;
            }
    
        var data = {
            email: $scope.account.email,
            password: $scope.account.password,
            username: $scope.account.username
        };        
        
        $scope.waitingForComplete = true;
        authentication.signup(data,{capcha:grecaptcha.getResponse()},function(errResponse){
            $scope.waitingForComplete = false;
            if(errResponse) {
                $scope.error = errResponse.data.message;
                return;
            }
            
            // trigger principal load of identity
            $scope.$emit('loginController.loginStarts');
            principal.identity(true).then(function() {
                $scope.$emit('loginController.loginEnds');
                $state.go('console.home');
            });            
        });
    }
}

module.exports = signupController;