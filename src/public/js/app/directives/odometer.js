'use strict';

var angular = require('angular');

require('../../../scss/odometer.scss');

// javascript mode
var Odometer = require('odometer/odometer.js')

module.exports = angular.module('odometer.directives',[])
    .directive('odometer', [
       function() {
           return {
             restrict: 'E',
             scope: {
                 count:'=',
             },
             template: require('../../../templates/odometer.html'),
             link:function(scope,element) {
                var el = element[0].querySelector('span'),
                    od = new Odometer({el: el});

                scope.$watch('count', function(value) {
                    od.update(value); 
                });
             }  
           };
       } 
    ]);