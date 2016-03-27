var angular = require('angular');

angular.module('pdfhummus-web', [
    require('angular-ui-router'),
    require('oclazyload'),
    require('./directives/app-header').name,
    require('./directives/app-footer').name,
    require('./directives/page-title').name,
    require('./directives/jobs-list').name,
    require('./services/generation-jobs').name,
])
    .config(require('./config/router'))
    .controller('appController', require('./controllers/app-controller'));
