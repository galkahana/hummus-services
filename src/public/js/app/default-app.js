var angular = require('angular');

angular.module('pdfhummus-web', [
    require('angular-ui-router'),
    require('oclazyload'),
    require('./directives/app-header').name,
    require('./directives/app-footer').name
])
    .config(require('./config/router'))
    .controller('appController', require('./controllers/app-controller'));
