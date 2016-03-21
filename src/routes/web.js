'use strict';

var express = require('express'),
    router = express.Router(),
    path = require('path');

// Root - any: route to index file (angular web app, to support deep linking without #)
router.get('/*', function (req, res) {
    res.sendFile('index.html', {root: path.join(__dirname, '../../dist')});
});

module.exports = router;