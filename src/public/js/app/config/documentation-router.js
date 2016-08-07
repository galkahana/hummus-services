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

    $urlRouterProvider.otherwise('documentation');

    $stateProvider
        .state('documentation', { 
            url: '/documentation',
            abstract:true,
            template: '<ui-view autoscroll="false"></ui-view>'
        })
        .state('documentation.home', {
            url: '',
            template: '<strong>hello world</strong>'
        })
        .state('documentation.home1', {
            url: '/home1',
            template: require('../../../mds/home1.md'),
        })
}

module.exports = router;
