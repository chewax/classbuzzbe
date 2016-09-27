(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;

    var specialEventSchema = new mongoose.Schema({

            name: {type: String},
            difficulty: {type: String, enum: ["easy", "medium", "hard"]},
            approvesWith: {type: Number, default: 3 },

            group: {type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null},         //All students from a group or null
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},   //All students from a customer or null
            teacher: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},        //All students of a teacher or null

            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],        //Skills that are affected by the special event.

            startingDate: {type: Date, default: Date.now},
            endingDate: {type: Date, default: null}             //Null == neverending.

        },

        { collection: 'SpecialEvents' }
    );

    specialEventSchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('SpecialEvent', specialEventSchema);

}).call(this);
