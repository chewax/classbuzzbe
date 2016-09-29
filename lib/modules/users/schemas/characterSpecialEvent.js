(function(){
    'use strict';

    var mongoose = require('mongoose');

    /**
     * Character Special Event Schema
     * Will store the users character's assigned special events.
     */
    var characterSpecialEvent = new mongoose.Schema({
        specialEvent: {type: mongoose.Schema.Types.ObjectId, ref: 'SpecialEvent', default: null},
        assigned: {type: Date, default: Date.now },
        completed: {type: Date, default: null},
        grade: {type: Number, default: 0}
    });

    /**
     * Attribute to check if special event isCompleted
     * Name: isCompleted.
     */
    characterSpecialEvent.virtual('isCompleted').get(function(){
        return (this.completed != null);
    });

    characterSpecialEvent.set('toObject', { virtuals: true });
    characterSpecialEvent.set('toJSON', { virtuals: true });

    module.exports = characterSpecialEvent;

}).call(this);
