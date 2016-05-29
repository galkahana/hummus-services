'use strict';

var express = require('express'),
    router = express.Router(),
    path = require('path');

// Root - any: route to index file (angular web app, to support deep linking without #)

function loginApp(req, res) {
    res.sendFile('console.html', {root: path.join(__dirname, '../../dist')});
}

router.get('/login', loginApp);
router.get('/console', loginApp);
router.get('/console/*', loginApp);
router.get('/*', function (req, res) {
    res.sendFile('index.html', {root: path.join(__dirname, '../../dist')});
});

module.exports = router;