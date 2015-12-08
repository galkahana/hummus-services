/**
 * Created by asafam on 1/3/15.
 */

'use strict';

var express = require('express'),
    router = express.Router(),
	path = require('path');


var controllersPath = path.resolve(__dirname,'../controllers/api/') + '/',
    generationJobsController = require(controllersPath + 'generation-jobs-controller'),
    generatedFilesController = require(controllersPath + 'generated-files-controller');

router.route('/generation-jobs')
    .post(generationJobsController.create);
router.route('/generation-jobs/:id')
    .get(generationJobsController.show);
router.route('/generated-files/:id')
    .get(generatedFilesController.download);

module.exports = router;
