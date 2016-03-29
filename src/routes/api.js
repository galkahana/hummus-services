/**
 * Created by asafam on 1/3/15.
 */

'use strict';

var express = require('express'),
    router = express.Router(),
    users = require('../services/users'),
    authentication = require('../services/authentication'),
	path = require('path');


var controllersPath = path.resolve(__dirname,'../controllers/api/') + '/',
    generationJobsController = require(controllersPath + 'generation-jobs-controller'),
    generatedFilesController = require(controllersPath + 'generated-files-controller');

router.route('/generation-jobs')
    .post(users.authenticateUserForExternalAPIOrDie,generationJobsController.create)
    .get(authentication.authenticateOrDie,generationJobsController.list)
router.route('/generation-jobs/:id')
    .get(users.authenticateUserForExternalAPIOrDie,generationJobsController.show);
router.route('/generated-files/:id')
    .get(users.authenticateUserForExternalAPIOrDie,generatedFilesController.download)
    .delete(users.authenticateUserForExternalAPIOrDie,generatedFilesController.delete)

// get this before it gets to web...so we're clear that there's an API error
router.get('/*', function (req, res) {
    res.notFound('API call not found');
});

module.exports = router;
