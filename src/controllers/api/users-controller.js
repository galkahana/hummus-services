'use strict';

var _ = require('lodash');

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
        
        res.status(200).json(_.pick(user,['name','email']));   
    };
}


module.exports = new UsersController();