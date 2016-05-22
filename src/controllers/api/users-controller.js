'use strict';

var _ = require('lodash'),
    users = require('../../services/users'),
    authentication = require('../../services/authentication'),
    remoteStorageService = require('../../services/remote-storage-service'),
    fileDownloadedAccountingEvents = require('../../services/file-downloaded-accounting-events'),
    jobRanAccountingEvents = require('../../services/job-ran-accounting-events'),
    async = require('async'),
    moment = require('moment');

function UsersController() {
     /**
     * GET /users/me
     * @param req request object with ID
     * @param res response object
     * @param next callback handler
     * @returns {*} 200 and tag JSON
     */
    this.me = function(req, res, next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. shouldnt get here');
        }
        
        res.status(200).json(user);   
    };
    
    function filterValidUpdateFields(payload) {
        return _.pick(payload,['name','email']);
    } 
    
    this.update = function(req,res,next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. shouldnt get here');
        }
        if(!user._id == req.params.id) {
            return res.forbidden('Can only update logged in user');
        }
        
        var updates = filterValidUpdateFields(req.body);
        
        users.update(user._id,updates,function(err,newUser) {
            if (err) { return next(err); }
            res.status(200).json(user);
        });
    }
    
    this.getPlanUsage = function(req,res,next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. shouldnt get here');
        }
        
        var to = req.query.to ? moment(req.query.to):moment().endOf('day');
        var toAsDate = to.toDate();
        var from = req.query.from ?  moment(req.query.to):moment(to).subtract(1,'month'); 
        var fromAsDate = from.toDate();   


        async.auto({
            'totalGenerationSize': function(cb) {
                jobRanAccountingEvents.getAccumulatedSizeFor(user._id,fromAsDate,toAsDate,cb);
            },
            'totalDownloadSize': function(cb) {
                fileDownloadedAccountingEvents.getAccumulatedSizeFor(user._id,fromAsDate,toAsDate,cb);
            },
            'totalStorageSize': function(cb) {
                remoteStorageService.getTotalUserFolderSize(user,cb);
            }
        },function(err,results) {
            if (err) { 
                return next(err); 
            }
            res.status(200).json({
                generation: {
                    count: results.totalGenerationSize.count,
                    size: results.totalGenerationSize.size
                },
                download: {
                    count: results.totalDownloadSize.count,
                    size: results.totalDownloadSize.size                    
                },
                totalStorageSize: results.totalStorageSize,
                from: fromAsDate,
                to: toAsDate
            });
        });
    }
    
    this.actions = function(req,res,next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. should have user for user actions');
        }
        
        var type = req.body.type;
        if(!type) {
            return res.badRequest('Missing type. should be changeUsername or changePassword');
        }
        
        switch(type) {
            case 'changeUsername': {
                var username = req.body.username;
                
                if(!username) {
                    res.badRequest('Missing username for username change');
                    break;
                }
                
                users.update(user._id,{username:username},function(err,newUser) {
                    if (err) { 
                        if(err.code == '11000') {
                            var newError = new Error("A user with this username already exists");
                            if(!newError.info)
                                newError.info = {};
                            newError.info.duplicateUsername = true;
                            return next(newError);
                        }
                        return next(err); 
                    }
                    res.status(200).json(user);
                });                
                break;
            }
            case 'changePassword': {
                var oldPassword = req.body.oldPassword;
                var newPassword = req.body.newPassword;
                
                if(!oldPassword) {
                    res.badRequest('Missing old password for password change');
                    break;
                }

                if(!newPassword) {
                    res.badRequest('Missing new password for password change');
                    break;
                }
                
                if(!authentication.passwordOK(user,oldPassword)) {
                    var newError = new Error("old password does not match");
                    if(!newError.info)
                        newError.info = {};
                    newError.info.oldPasswordMismatch = true;
                    return next(newError);                    
                }

                users.update(user._id,{password:authentication.encryptPassword(newPassword)},function(err,newUser) {
                    if (err) { 
                        return next(err); 
                    }
                    res.status(200).json(user);
                });                    
                
                break;
            }
            default: {
                res.badRequest('Unknown type. should be changeUsername or changePassword');
            }
        }
    }
}


module.exports = new UsersController();