(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    
    var goalSchema = new mongoose.Schema({
            name: {type:String},
            type: {type:String, enum: ['Activity', 'Item', 'Reward'], default: 'Activity'},
            amount: {type:Number, default:1},
            skill: {type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default: null},         //Which is the related skill for this goal. Used to check if completed activity matches the goal.
            activity: {type: mongoose.Schema.Types.ObjectId, ref: 'Activity', default: null},   //If null then is any activity of the skill otherwise goal is that particular activity.
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null}    //Activity customer
        },

        { collection: 'QuestGoals' }
    );

    goalSchema.methods.matchesActivity = function (activity) {
        if (this.type != 'Activity') return false;

        if (this.activity == null && this.skill == null) {
            //Any activity completed will do.
            return true;
        }

        if (this.activity != null) {
            //If activity is not null then check against received activity
            return this.activity.toString() == activity._id.toString();
        }

        if (this.skill != null) {
            var that = this;
            //Check if any of the activity skills match goal skill
            var matchingSkills = activity.skills.filter(function(s){
                return s.toString() == that.skill.toString();
            });

            if (matchingSkills.length > 0) return true;
        }

        //If it reaches here then is no match
        return false;

    };
    
        goalSchema.plugin(mongoosePaginate);
    var QuestGoal = mongoose.model('QuestGoal', goalSchema);
    module.exports = QuestGoal;

}).call(this);
