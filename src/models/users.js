var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps');


var userSchema = new Schema({
    name: {
        type:String,
        require:true
    }
});

userSchema.index({name: 1});
userSchema.plugin(timestamps, {index: true});


module.exports = mongoose.model('User', userSchema);