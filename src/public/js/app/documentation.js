var angular = require('angular');

angular.module('pdfhummus-web', [
    require('angular-cookies'),
    require('angular-animate'),
    require('oclazyload'),
    require('angular-ui-router'),
    require('./directives/public-header').name,
    require('./directives/public-footer').name
])
    .config(require('./config/documentation-router'))
    .controller('documentationController', require('./controllers/documentation-controller'));