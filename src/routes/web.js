'use strict';

var express = require('express'),
    router = express.Router(),
    path = require('path');

// Root - any: route to index file (angular web app, to support deep linking without #)

function consoleApp(req, res) {
    sendSiteFileFunc('console.html')(req,res);
}

function documentationApp(req, res) {
    sendSiteFileFunc('documentation.html')(req,res);
}

function sendSiteFileFunc(pathToPage) {
    return function(req,res) {
            res.sendFile(pathToPage, {root: path.join(__dirname, '../../dist')});
    }
}

// application
router.get('/login', consoleApp);
router.get('/signup', consoleApp);
router.get('/console', consoleApp);
router.get('/console/*', consoleApp);
router.get('/documentation', documentationApp);
router.get('/documentation/*', documentationApp);

// site pages
['about','contact'].forEach(function(value) {
    router.get('/' + value, sendSiteFileFunc(value + '.html'));
});

// index
router.get('/*', sendSiteFileFunc('index.html'));

module.exports = router;