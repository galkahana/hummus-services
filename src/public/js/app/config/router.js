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
        .state('home', {
            url: '/',
            template: require('../../../templates/home-page.html'),
            controller: require('../controllers/home-controller'),
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
        .state('test', {
            url: '/test',
            template: '<div>hello</div>',
            controller: function() {
                console.log('hello test');
            }
            
        })
}

module.exports = router;
