var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    timestamps = require('./plugins/timestamps');

var USER_STATUSES = ['trial','full'],
    USER_STATUSES_TRIAL = USER_STATUSES[0];

var userSchema = new Schema({
    username: {
        type:String,
        require:true,
        unique:true
    },
    email: {
        type:String,
        require:true
    },
    name: {
        type:String
    },
    password: {
        type:String,
        required:true
    },
    status: {
        type:String,
        enum: USER_STATUSES,
        required:true,
        default: USER_STATUSES_TRIAL

    }
});

userSchema.index({username: 1});
userSchema.index({email: 1});
userSchema.plugin(timestamps, {index: true});

var USER_PRIVATE_FIELDS = ['password'];
userSchema.set('toJSON', { 
    transform: function (doc, ret, options) {
        /*
            remove black listed fields
        */
        USER_PRIVATE_FIELDS.forEach(function(fn) {
           delete ret[fn]; 
        });
        
    }
});

userSchema.statics.USER_STATUSES_TRIAL = USER_STATUSES_TRIAL;

module.exports = mongoose.model('User', userSchema);