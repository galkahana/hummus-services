/**
 * Created by asafam on 1/3/15.
 */

'use strict';

var express = require('express'),
    router = express.Router(),
    users = require('../services/users'),
	path = require('path');


var controllersPath = path.resolve(__dirname,'../controllers/api/') + '/',
    generationJobsController = require(controllersPath + 'generation-jobs-controller'),
    generatedFilesController = require(controllersPath + 'generated-files-controller');

router.route('/generation-jobs')
    .post(users.authenticateUserForExternalAPIOrDie,generationJobsController.create);
router.route('/generation-jobs/:id')
    .get(users.authenticateUserForExternalAPIOrDie,generationJobsController.show);
router.route('/generated-files/:id')
    .get(users.authenticateUserForExternalAPIOrDie,generatedFilesController.download);

module.exports = router;
