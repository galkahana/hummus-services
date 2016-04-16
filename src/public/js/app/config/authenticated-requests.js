'use strict';

authenticatedRequests.$inject = ['$httpProvider'];
                    
function authenticatedRequests($httpProvider) {
    $httpProvider.interceptors.push('AuthenticationInterceptor');
}

module.exports = authenticatedRequests;
