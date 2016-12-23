(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var mongoosePaginate = require('mongoose-paginate');
    var localePlugin = require('../core/plugins/localesPlugin');
    var _ = require('lodash');


    var specialEventSchema = new mongoose.Schema({

            name: {type: String},
            difficulty: {type: String, enum: ["easy", "medium", "hard"]},
            approvesWith: {type: Number, default: 3 },

            group: {type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null},         //All students from a group or null
            customer: {type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null},   //All students from a customer or null
            teacher: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},        //All students of a teacher or null

            skills: [{type: mongoose.Schema.Types.ObjectId, ref: 'Skill', default:null}],       //Skills that are affected by the special event.

            startingDate: {type: Date, default: Date.now},
            endingDate: {type: Date, default: null}             //Null == neverending.

        },

        { collection: 'SpecialEvents' }
    );


    /**
     * Virtual Attribute to know is special event is active
     * Name: isActive
     */
    specialEventSchema.virtual('isActive').get(function(){
        return ( this.startingDate <= Date.now() && (Date.now() <= this.endingDate || this.endingDate == null) );
    });

    /**
     * Virtual Attribute to get user groups owned.
     */
    specialEventSchema.virtual('eligibleChests', {
        ref: 'Chest',
        localField: 'difficulty',
        foreignField: 'bossDifficulty'
    });

    /**
     * Get Active special events for a given student in a dateRange
     * @param student
     * @param fromDate
     * @param toDate
     * @returns {Query|Timestamp|Long}
     */
    specialEventSchema.statics.getActive = function( student, fromDate, toDate ) {

        if (_.isNil(fromDate)) fromDate = Date.now();
        if (_.isNil(toDate)) toDate = Date.now();

        var _groups;

        return student.belongingGroups()
            .then(function(groups){
                _groups = groups;
                return student.findStudentTeachers();
            })
            .then(function(_teachers){

                var orFilters = [];
                orFilters.push({$or: [{group: {$in: _groups}}, {group:null}]});
                orFilters.push({$or: [{customer: student.customer}, {customer:null}]});
                orFilters.push({$or: [{teacher: {$in: _teachers}}, {teacher:null}]});

                var andFilters = [];
                andFilters.push({$or:[{startingDate: {$lte: toDate}}, {startingDate:null}]});
                andFilters.push({$or:[{endingDate: {$gte: fromDate}}, {endingDate:null}]});

                return SpecialEvent.find().populate('eligibleChests skills').or(orFilters).and(andFilters);
            })
            .catch(function(err){
                console.log(err);
            })

    };

    //For Virtual Fields
    specialEventSchema.set('toObject', { virtuals: true });
    specialEventSchema.set('toJSON', { virtuals: true });

    specialEventSchema.plugin(mongoosePaginate);
    specialEventSchema.plugin(localePlugin);

    var SpecialEvent = mongoose.model('SpecialEvent', specialEventSchema);
    module.exports =  SpecialEvent;

}).call(this);
