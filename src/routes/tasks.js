'use strict';

var express = require('express'),
    router = express.Router(),
	path = require('path');


var tasksPath = path.resolve(__dirname,'../tasks/') + '/',
    deleteTimeoutTask = require(tasksPath + 'delete-timedout-files');


// general middleware to verify request is coming from cloud cron
router.use(function (req, res, next) {
  if(req.get('X-Appengine-Cron') === 'true') {
    return next();
  } else {
    return res.forbidden();
  }
});

router.route('/delete-timedout-files')
    .get(deleteTimeoutTask.run)

// get this before it gets to web...so we're clear that there's an API error
router.get('/*', function (req, res) {
    res.notFound('API call not found');
});

module.exports = router;