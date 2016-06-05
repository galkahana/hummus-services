var angular = require('angular');

angular.module('pdfhummus-web', [
    require('angular-cookies'),
    require('angular-animate'),
    require('./directives/public-header').name,
    require('./directives/public-footer').name,
    require('./directives/odometer').name,
    require('./services/accounting').name,
])
    .controller('loginController', require('./controllers/login-controller'))
    .controller('welcomeController', require('./controllers/welcome-controller'))
    .controller('defaultController', require('./controllers/default-controller'));
