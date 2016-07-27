(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var achievementSchema = new mongoose.Schema({
            name: {type:String},
            nameTranslation: {type:String},
            xpAward: Number,
            type: {type: String, enum: ['reward', 'penalty'], default:'reward'},
            avatarURL: {type: String, default:null},
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},
            isActive: { type: Boolean, default: true },
            usageCount: {type: Number, default:0, index:true},
            createsQuest: {type: Boolean, default: false},
            questInfo: {type:String, default:''},
            colour: {type: String}

        },

        { collection: 'Achievements' }
    );

    achievementSchema.plugin(mongoosePaginate);

    var Achievement = mongoose.model('Achievement', achievementSchema);
    module.exports =  Achievement;

}).call(this);
