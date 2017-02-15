(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var random = require('mongoose-simple-random');
    var mongoosePaginate = require('mongoose-paginate');

    var questReward = new mongoose.Schema({
        xp: {type: Number, default: 0},
        money: {type :Number, default: 0}
    });

    var questSchema = new mongoose.Schema({
            name: {type:String},
            reward: questReward,
            goals: [{type: mongoose.Schema.Types.ObjectId, ref: 'QuestGoal', default: null}],
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null}
        },

        { collection: 'Quests' }

    );

    questSchema.plugin(mongoosePaginate);
    questSchema.plugin(random);
    var Quest = mongoose.model('Quest', questSchema);
    module.exports =  Quest;

}).call(this);
