var user = require('../models/users');

function Users() {
}

Users.prototype.update = function (id, data, callback) {
    user.findOneAndUpdate({_id: id}, {$set:data},{new: true},callback);
};

module.exports = new Users();