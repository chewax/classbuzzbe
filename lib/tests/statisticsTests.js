(function(){
    'use strict';

    var assert = require('assert');
    var statController = require('./statistics/statisticsController');

    describe('Statistics', function(){
        describe('#teacherAchievementStats()', function(){
            it('should return an object', function() {
                assert.equal('object', typeof statController.teacherAchievementStats("561bfd74f2b37bee3475d426"));

            })
        })
    })


}).call(this);
