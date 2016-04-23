'use strict';

var Client = require('../../models/clients'),
    AccessToken = require('../../models/access-tokens'),
    oauth2 = require('../../services/oauth2'),
    randomSeconds = require('../../services/random-seconds');

/*
    im faking some wait time to throw of potential hackers a bit.
    ok and maybe make my users db seem large :).
    but mainly for the first reason
*/

function waitRandomSeconds(min,max,cb) {
    setTimeout(cb,randomSeconds(min,max));
}

function waitBadRandomSeconds(cb) {
    waitRandomSeconds(3,10,cb);
}

function waitGoodRandomSeconds(cb) {
    waitRandomSeconds(1,3,cb);
}


function AuthenticationController() {

    this.signIn = function(req, res, next) {
        /*
            Sign in prepares tokens for a login scenario
        */
        if (!req.user) {
            // first make sure i got a user
            waitBadRandomSeconds(function() {
                res.unauthenticated('Unauthenticated request');                
            })
        }else {
            var clientId = req.body.clientId,
                clientSecret = req.body.clientSecret;
                
            if (!clientId || !clientSecret) {
                waitBadRandomSeconds(function() {
                    res.badRequest('Missing client credentials');               
                });
            } else {
                Client
                    .findOne({ clientId: clientId, clientSecret: clientSecret })
                    .exec(function (err, client) {
                        if (err || !client) {
                            waitBadRandomSeconds(function() {
                                if(err)
                                    res.unprocessable(err);
                                else 
                                    res.unprocessable(err, 'Invalid client or client credentials');
                            }) ;
                        }

                        oauth2.generateTokens(req.user, client, function (err, refreshToken, accessToken) {
                            if (err) {
                                waitBadRandomSeconds(function() {
                                    return res.unprocessable(err); 
                                });
                            } else {
                                waitGoodRandomSeconds(function() {
                                    res.status(201).json({
                                        refreshToken: refreshToken, 
                                        accessToken: accessToken 
                                    });
                                });
                            }
                        });
                    });            
                }                        
            }
    };
    
    this.signOut = function(req,res,next) {        
        if(req.info && 
            req.info.provider == 'bearer' && 
            !!req.info.accessToken) {
                AccessToken.findOneAndRemove({value: req.info.accessToken}, function(err) {
                    if (err) {
                        return res.serverError(err);
                    }
                
                    res.status(200).json({
                        ok:true
                    });
                });                
            }
            else {
                res.status(200).json({
                    ok:true
                });   
            }
    }
}


module.exports = new AuthenticationController();