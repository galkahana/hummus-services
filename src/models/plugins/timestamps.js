'use strict';

var timestampsPlugin = function lastModifiedPlugin(schema, options) {
    // add created_at & updated_at fields
    schema.add({
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    });

    schema.pre('save', function(next) {
        this.updatedAt = Date.now();
        next();
    });

    if (options && options.index) {
        schema.path('updatedAt').index(options.index);
    }
};

module.exports = timestampsPlugin;