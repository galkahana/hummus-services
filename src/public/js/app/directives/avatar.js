'use strict';

var angular = require('angular'),
    md5 = require('blueimp-md5');

require('../../../scss/avatar.scss');

module.exports = angular.module('avatar.directives',[])
    .directive('avatar', [
       function() {
           return {
             restrict: 'E',
             scope: {
                 username:"="
             },
             template: require('../../../templates/avatar.html'),
             link:function($scope) {
                 $scope.avatarLetter = function() {
                     if(!$scope.username) return null;
                     return $scope.username.length > 0 ? $scope.username[0]:'O';
                 }
                 
                 function usernameHash(username) {
                     return md5(username.trim().toLowerCase());
                 }
                 
                 // using gravatar for image
                 $scope.imageURL = function() {
                     if(!$scope.username) return null;

                    return 'https://www.gravatar.com/avatar/' + usernameHash($scope.username) + '?s=50&d=blank';                    
                 }
             }  
           };
       } 
    ]);