(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var specialEventSchema = new mongoose.Schema({

            name: {type: String},
            difficulty: {type: String, enum: ["easy", "medium", "hard"]},
            approvesWith: {type: Number, default: 3 },

            group: {type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null},         //All students from a group or null
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},   //All students from a customer or null
            teacher: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},        //All students of a teacher or null

            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],       //Skills that are affected by the special event.

            startingDate: {type: Date, default: Date.now},
            endingDate: {type: Date, default: null}             //Null == neverending.

        },

        { collection: 'SpecialEvents' }
    );

    /**
     * Virtual Attribute to know is special event is active
     * Name: isActive
     */
    specialEventSchema.virtual('isActive').get(function(){
        return ( this.startingDate <= Date.now() && (Date.now() <= this.endingDate || this.endingDate == null) );
    });

    /**
     * Virtual Attribute to get user groups owned.
     */
    specialEventSchema.virtual('eligibleChests', {
        ref: 'Chest',
        localField: 'difficulty',
        foreignField: 'bossDifficulty'
    });

    specialEventSchema.statics.getActive = function( user ) {
        //return this.find({$and:[{}]})
    };

    //For Virtual Fields
    specialEventSchema.set('toObject', { virtuals: true });
    specialEventSchema.set('toJSON', { virtuals: true });

    specialEventSchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('SpecialEvent', specialEventSchema);

}).call(this);