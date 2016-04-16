var _ = require('lodash'),
    angular = require('angular');

module.exports.defaultRestangular = ['RestangularProvider',
    function config(RestangularProvider) {
        // Restangular
        RestangularProvider.setBaseUrl('__apiURL__');
        RestangularProvider.setRestangularFields({id: '_id'});
        RestangularProvider.setFullResponse(true);
        
        // Generic handler
        RestangularProvider.addFullRequestInterceptor(
            function(elemenet, operation, what, url, headers, params) {
                if (operation === "remove") {
                    // to avoid issues in browsers that require no payload
                    return null;
                } 
                // IE Cache Invalidation
                return {params: _.extend(params, {cacheKilla: new Date().getTime()})};
            });
    }];

