(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    /**
     * Skill Schema.
     * Will store a customer's skills
     * eg: [Use of English, Grammar, Writing, Speaking, Listening]
     * Customer should be treated as a restriction attribute. With customer set to null, skill applies to all customers.
     * This is the case for example, for [Behaviour, Fellowship]
     */
    var newSchema = new mongoose.Schema({
            name:       { type: String},
            customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
            createdAt:  { type: Date, default: Date.now },
            updatedAt:  { type: Date, default: Date.now }
        },

        { collection: 'Skills' }
    );

    newSchema.pre('save', function(next){
        this.updatedAt = Date.now();
        next();
    });

    newSchema.pre('update', function() {
        this.update({}, { $set: { updatedAt: new Date() } });
    });

    newSchema.plugin(mongoosePaginate);
    module.exports = mongoose.model('Skill', newSchema);

}).call(this);
