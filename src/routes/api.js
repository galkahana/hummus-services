'use strict';

var express = require('express'),
    router = express.Router(),
    authentication = require('../services/authentication'),
    authorization = require('../services/authorization'),
    authorize = authorization.authorize,
    permissions = authorization.getPermissions(),

	path = require('path');


var controllersPath = path.resolve(__dirname,'../controllers/api/') + '/',
    generationJobsController = require(controllersPath + 'generation-jobs-controller'),
    generatedFilesController = require(controllersPath + 'generated-files-controller'),
    usersController = require(controllersPath + 'users-controller'),
    authenticationController = require(controllersPath + 'authentication-controller'),
    tokensController = require(controllersPath + 'tokens-controller');

router.route('/generation-jobs')
    .post(authentication.authenticateOrDie,authorize(permissions.createPDF),generationJobsController.create)
    .get(authentication.authenticateOrDie,authorize(permissions.manageJobs),generationJobsController.list)
router.route('/generation-jobs/actions')
    .post(authentication.authenticateOrDie,authorize(permissions.manageJobs),generationJobsController.actions)
router.route('/generation-jobs/:id')
    .get(authentication.authenticateOrDie,authorize(permissions.createPDF),generationJobsController.show);
router.route('/generated-files')
    .get(authentication.authenticateOrDie,authorize(permissions.manageJobs),generatedFilesController.list)
router.route('/generated-files/:id')
    .get(authentication.authenticateOrDie,authorize(permissions.createPDF),generatedFilesController.show)
    .delete(authentication.authenticateOrDie,authorize(permissions.manageJobs),generatedFilesController.delete)
router.route('/generated-files/:id/download')
    .get(authentication.authenticateOrDie,authorize(permissions.manageJobs),generatedFilesController.download)
router.route('/users/me')
    .get(authentication.authenticateOrDie,authorize(permissions.siteGeneric),usersController.me)
router.route('/tokens')
    .get(authentication.authenticateOrDie,authorize(permissions.siteGeneric),tokensController.show)
router.route('/tokens/actions')
    .post(authentication.authenticateOrDie,authorize(permissions.siteGeneric),tokensController.actions)
router.route('/authenticate/sign-in')
    .post(authentication.login,authenticationController.signIn)
router.route('/authenticate/sign-out')
    .delete(authentication.authenticateOrDie,authorize(permissions.siteGeneric),authenticationController.signOut)
router.route('/public/:publicDownloadId/download')
    .get(generatedFilesController.downloadPublic);


// get this before it gets to web...so we're clear that there's an API error
router.get('/*', function (req, res) {
    res.notFound('API call not found');
});

module.exports = router;
