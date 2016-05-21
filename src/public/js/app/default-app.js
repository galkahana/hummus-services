var angular = require('angular');

angular.module('pdfhummus-web', [
    require('angular-cookies'),
    require('angular-ui-router'),
    require('angular-ui-layout'),
    require('oclazyload'),
    require('angular-animate'),
    require('./directives/console-header').name,
    require('./directives/console-footer').name,
    require('./directives/public-header').name,
    require('./directives/public-footer').name,
    require('./directives/page-title').name,
    require('./directives/jobs-list').name,
    require('./directives/date-range-picker').name,
    require('./directives/api-keys-panel').name,
    require('./directives/general-panel').name,
    require('./directives/plan-panel').name,
    require('./directives/code-editor').name,
    require('./directives/pdf-preview').name,
    require('./services/generation-jobs').name,
    require('./services/modal-alert').name,
    require('./services/constants').name,
    require('./services/authorization').name,
    require('./services/principal').name,
    require('./services/users').name,
    require('./services/authentication').name,
    require('./services/authentication-interceptor').name
])
    .config(require('./config/router'))
    .config(require('./config/authenticated-requests'))
    .controller('appController', require('./controllers/app-controller'))
    .run(require('./config/login-setup'));