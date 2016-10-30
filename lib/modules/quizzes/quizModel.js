(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var quizQuestion = require('./schemas/quizQuestion');

    var quizSchema = new mongoose.Schema({
            owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            questions: [quizQuestion],
            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],
            difficulty: {type: String, enum: ["easy", "medium", "hard"]},
            approvesWith: {type: Number, default: 0.8 } //correct answers.
        },

        { collection: 'Quizzes' }
    );

    /**
     * Virtual Attribute to get user groups owned.
     */
    quizSchema.virtual('eligibleChests', {
        ref: 'Chest',
        localField: 'difficulty',
        foreignField: 'bossDifficulty'
    });

    quizSchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('Quiz', quizSchema);

}).call(this);

