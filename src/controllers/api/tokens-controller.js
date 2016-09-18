
var oauth2 = require('../../services/oauth2'),
    Client = require('../../models/clients'),
    User = require('../../models/users'),
    constants = require('../../models/constants'),
    _ = require('lodash');

function isEligibleForTokensCreation(user) {
    return user.status !== User.USER_STATUSES_TRIAL;
}


function TokensController() {
    this.show = function(req,res,next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. should have user for identifying tokens');
        }
        
        var clientId = req.info && req.info.token ? req.info.token.clientId:null;
        if(!clientId) {
            return res.badRequest('No clientId, cant identify client');
        }

        // looking per client Id. no need to pass secret again, as i already have a token, and supposedly secure
        Client
            .findOne({ clientId: clientId}) 
            .exec(function (err, client) {
                if (err || !client) {
                    if(err)
                        res.unprocessable(err);
                    else 
                        res.unprocessable(err, 'Invalid client');
                    return;
                }
                
                oauth2.getAccessTokens(user,
                                client,
                                {
                                    'tokenTypes': [constants.eTokenRolePublicAPI,constants.eTokenRolePrivateAPI]
                                },
                                function(err,tokens) {
                    if (err) { return next(err); }
                    
                    var publicAPIToken = _.find(tokens,{'tokenType':constants.eTokenRolePublicAPI});
                    var privateAPIToken =_.find(tokens,{'tokenType':constants.eTokenRolePrivateAPI});
                    
                    res.status(200).json({
                        public: publicAPIToken ? publicAPIToken.value:null,
                        private: privateAPIToken ? privateAPIToken.value:null
                    });
                }); 
        
            });
    }
    
    this.actions = function(req,res,next) {
        var user = req.user;
        if (!user) {
            return res.badRequest('Missing user. should have user for identifying whose jobs are being manipulated');
        }
        
        var type = req.body.type;
        if(!type) {
            return res.badRequest('Missing type. should be revoke or create');
        }
        
        var clientId = req.info && req.info.token ? req.info.token.clientId:null;
        if(!clientId) {
            return res.badRequest('No clientId, cant identify client');
        }

        // looking per client Id. no need to pass secret again, as i already have a token, and supposedly secure
        Client
            .findOne({ clientId: clientId}) 
            .exec(function (err, client) {
                if (err || !client) {
                    if(err)
                        res.unprocessable(err);
                    else 
                        res.unprocessable(err, 'Invalid client');
                    return;
                }
                switch(type) {
                    case 'revoke': {
                        if(!req.body.tokenType ||
                            (req.body.tokenType !== constants.eTokenRolePrivateAPI &&
                                req.body.tokenType !== constants.eTokenRolePublicAPI)) {
                            return res.badRequest('Missing token type. should request kind of token type');
                        }

                        oauth2.revokeTokens(user,
                                           client,
                                           {tokenType:req.body.tokenType},
                                           function(err) {
                            if (err) {
                                return res.unprocessable(err); 
                            } else {
                                return res.status(200).json({ok:true});
                            }
                        });                                               
                        break;
                    }
                    case 'create': {
                        if(!isEligibleForTokensCreation(user)) {
                            var newError = new Error("User cannot create API tokens");
                            if(!newError.info)
                                newError.info = {};
                            newError.info.notEligible = true;
                            return res.unprocessable(newError);

                        }

                        if(!req.body.tokenType ||
                            (req.body.tokenType !== constants.eTokenRolePrivateAPI &&
                                req.body.tokenType !== constants.eTokenRolePublicAPI)) {
                            return res.badRequest('Missing token type. should request kind of token type');
                        }
                        
                        oauth2.generateTokens(user, 
                                            client,
                                            {tokenType:req.body.tokenType}, 
                                            function (err, refreshToken, accessToken) {
                            if (err) {
                                return res.unprocessable(err); 
                            } else {
                                return res.status(201).json({
                                        refreshToken: refreshToken, 
                                        accessToken: accessToken 
                                    });
                            }
                        });
                        break;
                    }
                    case 'refreshMe': {
                        // site token updte
                        oauth2.generateTokens(user, 
                                            client,
                                            {tokenType:constants.eTokenRoleSiteUser}, 
                                            function (err, refreshToken, accessToken) {
                            if (err) {
                                return res.unprocessable(err); 
                            } else {
                                return res.status(201).json({
                                        refreshToken: refreshToken, 
                                        accessToken: accessToken 
                                    });
                            }
                        });
                        break;                        
                    }
                    default: {
                        res.badRequest('Unknown type. should be deleteAll');
                    }
                }
            });
    }
}

module.exports = new TokensController();
