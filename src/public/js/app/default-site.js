var angular = require('angular');

angular.module('pdfhummus-web', [
    require('angular-cookies'),
    require('angular-animate'),
    require('./directives/public-header').name,
    require('./directives/public-footer').name
])
    .controller('loginController', require('./controllers/login-controller'))
    .controller('welcomeController', require('./controllers/welcome-controller'));
