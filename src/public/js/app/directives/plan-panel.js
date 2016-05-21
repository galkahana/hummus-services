'use strict';

var angular = require('angular');
        
module.exports = angular.module('plan-panel.directives',[
    require('../services/users').name,
    require('../services/constants').name,
    require('../filters/bytes').name,
    require('../filters/moment-formatter').name,
])
    .directive('planPanel', ['Users','Constants',
       function(Users,Constants) {
           return {
             restrict: 'E',
             scope: {
             },
             template: require('../../../templates/plan-panel.html'),
             link: function(scope) {
                 scope.dateFormatter = Constants.DEFAULT_DATE_FILTER;
                 
                 function loadData() {
                     Users.getPlanUsageData().then(function(response) {
                         scope.planUsage = response.data;
                     },function(err) {
                         console.log(err);
                     })
                 }
                 loadData();
             }
           };
       } 
    ]);