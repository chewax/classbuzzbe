(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * Character Chest Schema
     * Will store the character's chests.
     */
    var characterChest = new mongoose.Schema({
        chest: {type: mongoose.Schema.Types.ObjectId, ref: 'Chest', default: null},

        // This number has to do with the grade the student managed when the chest was awarded.
        // The better the grade, the better the odds when the chest is opened.
        oddsModifier: {type:Number, default: 0},

        opened: {type: Date, default: null},
        acquired: {type: Date, default: Date.now}
    });

    module.exports = characterChest;

}).call(this);


