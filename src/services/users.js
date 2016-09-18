var user = require('../models/users');

function Users() {
}

Users.prototype.update = function (id, data, callback) {
    user.findOneAndUpdate({_id: id}, {$set:data},{new: true},callback);
};

Users.prototype.create = function (data, callback) {
    user.create(data,callback);
};

module.exports = new Users();