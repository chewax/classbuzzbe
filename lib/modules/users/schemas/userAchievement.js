(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * User Achievement
     * Will store a user achievement
     */
    var userAchievement = new mongoose.Schema({
        achievement: {type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', default: null},
        timestamp: {type: Date, default: Date.now}
    });

    module.exports = userAchievement;

}).call(this);

