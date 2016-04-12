'use strict';

var angular = require('angular');

require('../../../scss/app-header.scss');

module.exports = angular.module('app-header.directives',[
    require('../services/users').name,
    require('./avatar').name
])
    .directive('appHeader', ['Users',
       function(Users) {
           return {
             restrict: 'E',
             template: require('../../../templates/app-header.html'),
             link:function($scope) {
                 
                Users.me().then(function(response) {
                    $scope.user = response.data;
                },
                function(err) {
                    console.log('error!',err);
                    if(cb)
                        cb(err);
                });
             }  
           };
       } 
    ]);