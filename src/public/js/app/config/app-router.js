/**
 * Created by galkahana on 06/03/2016.
 */

'use strict';

router.$inject = [  '$ocLazyLoadProvider', 
                    '$locationProvider', 
                    '$stateProvider', 
                    '$urlRouterProvider', 
                    '$urlMatcherFactoryProvider'];
                    
function router($ocLazyLoadProvider, 
                $locationProvider, 
                $stateProvider, 
                $urlRouterProvider, 
                $urlMatcherFactoryProvider) {

    $ocLazyLoadProvider.config({
        cssFilesInsertBefore: 'ng_load_plugins_before'
    });

    $urlMatcherFactoryProvider.strictMode(false);

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false,
        rewriteLinks: false // rewrite links means that plain hrefs will use the routing too, globaly. i'm
                            // removing this to allow the current state where some urls do not go through routing
                            // see here: http://stackoverflow.com/questions/28127661/how-to-get-angular-ui-router-to-respect-non-routed-urls
    });

    // For any unmatched url, send to base
    $urlRouterProvider.otherwise('/');

    $stateProvider
        // login entry point (no uiview)
        .state('login', { 
            url: '/login',
            data: {pageTitle: 'Log in to Console'},
            template: require('../../../templates/login-page.html'),
            controller: require('../controllers/login-controller')
        })
        .state('signup', { 
            url: '/signup',
            data: {pageTitle: 'Sign Up'},
            template: require('../../../templates/signup-page.html'),
            controller: require('../controllers/signup-controller')
        })
        // restricted areas
        .state('console', { 
            url: '/console',
            abstract:true,
            controller: require('../controllers/console-base-controller'),
            template: require('../../../templates/console-base.html'),
            resolve: {
                authorize: ['authorization',
                    function(authorization) {
                        return authorization.authorize();
                    }
                ]
            }
        })
        .state('console.home', {
            url: '',
            data: {pageTitle: 'Welcome!'},
            template: require('../../../templates/home-page.html'),
            controller: require('../controllers/home-controller'),
        })
        .state('console.playground', {
            url: '/playground',  
            data: {pageTitle: 'Playground', pageSubTitle: 'Create & Test Job Tickets'},
            template: require('../../../templates/playground-page.html'),
            controller: require('../controllers/playground-controller'),            
            resolve: {
               deps: ['$q', '$ocLazyLoad',  function ($q, $ocLazyLoad) {
                            // attempt at lazy loading...not so great...
                   
                            var deferred = $q.defer();
                            require.ensure([], function () {
                                $ocLazyLoad.load({
                                    name: require('../filters/pretty-stringify').name
                                });
                                deferred.resolve(module);
                            });

                            return deferred.promise;
                        }]
            }
        })
        .state('console.jobs', {
            url: '/jobs',
            data: {pageTitle: 'Jobs', pageSubTitle: 'Manage your PDF jobs'},
            template: require('../../../templates/jobs-page.html'),
            controller: require('../controllers/jobs-controller'),            
        })
        .state('console.user', {
            url: '/user',
            template: require('../../../templates/user-page.html'),
            controller: require('../controllers/user-controller'),            
        })
}

module.exports = router;
