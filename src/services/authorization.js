'use strict';

var RBAC = require('rbac2'),
    async = require('async'),
    constants = require('../models/constants');

function Authorization() {

    var permissions = {
        createPDF:'createPDF',
        manageJobs:'manageJobs',
        siteGeneric:'siteGeneric'
    };

    var rules = [
        // siteUser
        {a: constants.eTokenRoleSiteUser, can: permissions.createPDF},
        {a: constants.eTokenRoleSiteUser, can: permissions.manageJobs},
        {a: constants.eTokenRoleSiteUser, can: permissions.siteGeneric},
        
        // privateAPI
        {a: constants.eTokenRolePrivateAPI, can: permissions.createPDF},
        {a: constants.eTokenRolePrivateAPI, can: permissions.manageJobs},
        
        // publicAPI
        {a: constants.eTokenRolePublicAPI, can: permissions.createPDF},
    ];

    var rbac = new RBAC(rules);

    function check(user, action, params, done) {
        async.some(user.roles,
            function(role, callback) {
                
                if (!params) {
                    params = {};
                }
                params.user = user;
                rbac.check(role, action, params, function(err, result) {
                    if (err) { return done(err); }
                    return callback(result);
                });
            },
            function(result) {
                return done(null, result);
            });
    }

    this.authorize = function(action) {
        return function(req, res, next) {
            if (!action) { next(new Error('Action params is missing')); }
            if (!req.user) { return res.unauthenticated(null); }
            if (!req.info || !req.info.accessTokenType)  { return res.unauthenticated(null); }

            req.user.roles = [req.info.accessTokenType]; // for now user roles are entirely derived from the token
            check(req.user, action, req.params, function(err, authorized) {

                if (err) { return res.serverError(err); }
                if (!authorized) { return res.forbidden(); }
                next();
            });
        };
    };

    this.getPermissions = function() {
        return permissions;
    };
}

module.exports = new Authorization();
