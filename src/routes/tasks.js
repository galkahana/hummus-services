'use strict';

var express = require('express'),
    router = express.Router(),
	path = require('path');


var tasksPath = path.resolve(__dirname,'../tasks/') + '/',
    deleteTimeoutTask = require(tasksPath + 'delete-timedout-files');

router.route('/delete-timedout-files')
    .get(deleteTimeoutTask.run)

// get this before it gets to web...so we're clear that there's an API error
router.get('/*', function (req, res) {
    res.notFound('API call not found');
});

module.exports = router;