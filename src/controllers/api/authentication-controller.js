'use strict';

var Client = require('../../models/clients'),
    AccessToken = require('../../models/access-tokens'),
    oauth2 = require('../../services/oauth2');

function AuthenticationController() {

    this.signIn = function(req, res, next) {
        /*
            Sign in prepares tokens for a login scenario
        */
        
        var clientId = req.body.clientId,
            clientSecret = req.body.clientSecret;
            
        if (!clientId || !clientSecret) {
            return res.badRequest('Missing client credentials');
        }
        
        Client
            .findOne({ clientId: clientId, clientSecret: clientSecret })
            .exec(function (err, client) {
                if (err) { return res.unprocessable(err); }
                if (!client) { return res.unprocessable(err, 'Invalid client or client credentials'); }
                if (!req.user) { return res.unprocessable(err, 'Invalid user'); }

                oauth2.generateTokens(req.user, client, function (err, refreshToken, accessToken) {
                    if (err) { return res.unprocessable(err); }
                    res.status(201).json({
                        refreshToken: refreshToken, 
                        accessToken: accessToken 
                    });
                });
            });
    };
    
    this.signOut = function(req,res,next) {
        if(req.info && 
            req.info.provider == 'bearer' && 
            !!req.info.accessToken) {
                AccessToken.findOneAndRemove({value: req.info.accessToken}, function(err) {
                    if (err) {
                        return res.serverError(err);
                    }
                
                    res.status(204).json({
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