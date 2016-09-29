(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');

    var chestSchema = new mongoose.Schema({

            name: {type: String},

            //The difficulty of the boss that should be defeated to earn this chest
            bossDifficulty: {type: String, enum: ["easy", "medium", "hard"]},

            xp: {type: Number},
            money: {type: Number},

            loot: [{
                item: {type: mongoose.Schema.Types.ObjectId, ref: 'Trait', default:null},
                dropRate: {type: Number, default: 100}
            }],

            //Does this chest needs some special skill to be opened?
            isSkillBound: { type: Boolean, default: false},

            //If (isSkillBound) then what Skills are needed for opening chest?
            skillsNeeded: [{
                skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null},
                minRank: {type: mongoose.Schema.Types.ObjectId, ref: 'Rank', default:null}
            }],

            //May a player purchase this chest in the store?
            isPurchasable: { type: Boolean, default: false}

        },

        { collection: 'Chests' }
    );

    chestSchema.plugin(mongoosePaginate);
    module.exports =  mongoose.model('Chest', chestSchema);

}).call(this);
