(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var random = require('mongoose-simple-random');

    var questSchema = new mongoose.Schema({
            name: {type:String},
            reward: Number,
            trigger: {
                type: {type:String, default:'achievement'},
                achievement: {type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', default: null}
            },
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
        },

        { collection: 'Quests' }

    );

    questSchema.plugin(random);

    var Quest = mongoose.model('Quest', questSchema);

    module.exports =  Quest;

}).call(this);
