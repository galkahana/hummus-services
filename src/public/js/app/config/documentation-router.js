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
            template: require('../../../mds/introduction.md')
        })
        .state('documentation.gattingstarted', {
            url: '/getting-started',
            template: require('../../../mds/getting-started.md'),
        })
        .state('documentation.api', {
            url: '/api',
            abstract:true,
            template: '<ui-view autoscroll="false"></ui-view>'
        })
        .state('documentation.api.home', {
            url: '',
            template: require('../../../mds/api-reference.md')
        })
        .state('documentation.api.browser', {
            url: '/browser',
            template: require('../../../mds/api-reference-browser.md'),
        })
        .state('documentation.api.nodejs', {
            url: '/nodejs',
            template: require('../../../mds/api-reference-nodejs.md'),
        })
        .state('documentation.api.rest', {
            url: '/rest',
            template: require('../../../mds/api-reference-rest.md'),
        })
        .state('documentation.jobticket', {
            url: '/job-ticket',
            abstract:true,
            template: '<ui-view autoscroll="false"></ui-view>'
        })        
        .state('documentation.jobticket.home', {
            url: '',
            template: require('../../../mds/job-ticket.md'),
        })
        .state('documentation.jobticket.document', {
            url: '/document',
            template: require('../../../mds/job-ticket-document.md'),
        })
}

module.exports = router;
