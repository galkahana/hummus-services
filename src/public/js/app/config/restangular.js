var _ = require('lodash'),
    angular = require('angular');

module.exports.defaultRestangular = ['RestangularProvider',
    function config(RestangularProvider) {
        // Restangular
        RestangularProvider.setBaseUrl('__apiURL__');
        RestangularProvider.setRestangularFields({id: '_id'});
        RestangularProvider.setFullResponse(true);

        // IE Cache Invalidation
        RestangularProvider.addFullRequestInterceptor(
            function(elemenet, operation, what, url, headers, params) {
                return {params: _.extend(params, {cacheKilla: new Date().getTime()})};
            });
    }];

