'use strict';

var angular = require('angular');

require('bootstrap-webpack'); // verify that bootstrap is loaded
require('daterangepicker');
require('daterangepicker/daterangepicker-bs3.css');

var moment = require('moment'),
    $ = require('jquery');

module.exports = angular.module('date-range-picker.directives',[
    require('../services/constants.js').name
])
    .directive('dateRangePicker', ['Constants',
       function(Constants) {
           return {
             restrict: 'A',
             require:'?ngModel',
             link:function($scope,element,attr,ngModel) {                 
                    $(element[0]).daterangepicker(
                        { 
                            autoUpdateInput: !ngModel,
                            format: Constants.DEFAULT_DATE_FILTER,
                            showDropdowns: true,
                            opens:'left',
                            ranges: {
                                'Today': [moment(), moment()],
                                'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                                'Last 7 Days': [moment().subtract(6, 'days'), moment()],
                                'Last 30 Days': [moment().subtract(29, 'days'), moment()],
                                'This Month': [moment().startOf('month'), moment().endOf('month')],
                                'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                            }                            
                        }
                    );   
                    
                    $(element[0]).on('apply.daterangepicker', function(ev, picker) {
                        if(ngModel)
                            ngModel.$setViewValue(picker.startDate.format(Constants.DEFAULT_DATE_FILTER) + ' - ' + picker.endDate.format(Constants.DEFAULT_DATE_FILTER));
                    });

                    $(element[0]).on('show.daterangepicker', function(ev, picker) {
                        if(!ngModel)
                            return;
                        
                        var value = ngModel.$modelValue;
                        
                        if(value) {
                            var dates = value.split('-');
                            if(dates.length == 2) {
                                var startDate;
                                var endDate;

                                startDate = dates[0];
                                endDate = dates[1]
                                picker.setStartDate(startDate);
                                picker.setEndDate(endDate);
                            }
                        }
                    });              
             }

           };
       } 
    ]);