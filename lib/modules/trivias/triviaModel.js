(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var triviaQuestion = require('./schemas/triviaQuestion');

    var triviaSchema = new mongoose.Schema({
            owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            questions: [triviaQuestion],
            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],
            difficulty: {type: String, enum: ["easy", "medium", "hard"]},
            approvesWith: {type: Number, default: 0.8 } //correct answers.
        },

        { collection: 'Trivias' }
    );

    /**
     * Virtual Attribute to get user groups owned.
     */
    triviaSchema.virtual('eligibleChests', {
        ref: 'Chest',
        localField: 'difficulty',
        foreignField: 'bossDifficulty'
    });

    triviaSchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('Trivia', triviaSchema);

}).call(this);

