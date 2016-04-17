var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps');


var userSchema = new Schema({
    name: {
        type:String,
        require:true
    },
    email: {
        type:String,
        require:true
    },
    password: {
        type:String,
        required:true,
        select:false
    }
});

userSchema.index({name: 1},{email: 1});
userSchema.plugin(timestamps, {index: true});


module.exports = mongoose.model('User', userSchema);