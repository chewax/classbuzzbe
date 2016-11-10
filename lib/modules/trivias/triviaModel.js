(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var triviaQuestion = require('./schemas/triviaQuestion');

    var triviaSchema = new mongoose.Schema({
            title: {type: String, default: ""},
            owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            questions: [triviaQuestion],
            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],
            tags: [{type:String, default:""}],
            difficulty: {type: String, enum: ["easy", "medium", "hard"]},
            isPublic: {type:Boolean, default: true},
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

