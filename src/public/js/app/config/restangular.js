var _ = require('lodash'),
    angular = require('angular');

module.exports.defaultRestangular = ['RestangularProvider',
    function config(RestangularProvider) {
        // Restangular
        RestangularProvider.setBaseUrl('__apiURL__');
        RestangularProvider.setRestangularFields({id: '_id'});
        RestangularProvider.setFullResponse(true);
        
        // if it's not clear
        RestangularProvider.setDefaultHeaders({'Content-Type': 'application/json'});
        
        // Generic handler
        RestangularProvider.addFullRequestInterceptor(
            function(element, operation, what, url, headers, params) {
                if (operation == 'remove') {
                    // avoid payload issues at server
                    element = null;
                }

                return {
                    headers: headers,
                    // IE Cache Invalidation
                    params:  _.extend(params, {cacheKilla: new Date().getTime()}),
                    element: element,
                    httpConfig: {}
                };
            });
    }];

