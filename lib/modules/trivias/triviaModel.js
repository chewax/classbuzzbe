(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    var tagsPlugin = require('../core/plugins/tagsPlugin');

    var triviaQuestion = require('./schemas/triviaQuestion');

    var triviaSchema = new mongoose.Schema({
            title: {type: String, default: "", tag: true},
            owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default:null},
            questions: [triviaQuestion],
            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],
            difficulty: {type: String, enum: ["easy", "medium", "hard"], default: "easy", tag: true},
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
    triviaSchema.plugin(tagsPlugin, {hashtagsOnly: true});

    module.exports =  mongoose.model('Trivia', triviaSchema);

}).call(this);

