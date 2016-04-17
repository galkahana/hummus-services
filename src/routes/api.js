/**
 * Created by asafam on 1/3/15.
 */

'use strict';

var express = require('express'),
    router = express.Router(),
    authentication = require('../services/authentication'),
	path = require('path');


var controllersPath = path.resolve(__dirname,'../controllers/api/') + '/',
    generationJobsController = require(controllersPath + 'generation-jobs-controller'),
    generatedFilesController = require(controllersPath + 'generated-files-controller'),
    usersController = require(controllersPath + 'users-controller'),
    authenticationController = require(controllersPath + 'authentication-controller');

router.route('/generation-jobs')
    .post(authentication.authenticateOrDie,generationJobsController.create)
    .get(authentication.authenticateOrDie,generationJobsController.list)
router.route('/generation-jobs/actions')
    .post(authentication.authenticateOrDie,generationJobsController.actions)
router.route('/generation-jobs/:id')
    .get(authentication.authenticateOrDie,generationJobsController.show);
router.route('/generated-files/:id')
    .get(generatedFilesController.download)
    .delete(authentication.authenticateOrDie,generatedFilesController.delete)
router.route('/users/me')
    .get(authentication.authenticateOrDie,usersController.me)
router.route('/authenticate/sign-in')
    .post(authentication.loginOrDie,authenticationController.signIn)
router.route('/authenticate/sign-out')
    .delete(authentication.authenticateOrDie,authenticationController.signOut)


// get this before it gets to web...so we're clear that there's an API error
router.get('/*', function (req, res) {
    res.notFound('API call not found');
});

module.exports = router;
