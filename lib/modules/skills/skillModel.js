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
    var skillSchema = new mongoose.Schema({
            name:       { type: String},
            customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
            createdAt:  { type: Date, default: Date.now },
            updatedAt:  { type: Date, default: Date.now }
        },

        { collection: 'Skills' }
    );

    skillSchema.pre('save', function(next){
        this.updatedAt = Date.now();
        next();
    });

    skillSchema.pre('update', function() {
        this.update({}, { $set: { updatedAt: new Date() } });
    });

    
    skillSchema.statics.bake = function (skills, customerId) {
        console.log("Baking Skills".green);
        skills.forEach(function(s){
            var _newSkill = new Skill();
            _newSkill.name = s;
            _newSkill.customer = customerId;
            _newSkill.save();
        })
    };

    skillSchema.plugin(mongoosePaginate);
    var Skill = mongoose.model('Skill', skillSchema);
    module.exports = Skill;

}).call(this);
