(function () {

        'use strict';

        var mongoose = require('../../database').Mongoose;
        var _ = require('lodash');

        /**
         * The reactions to that post/news
         * [like, happy, sad, awesome]
         */
        var newsItemReaction = new mongoose.Schema({
            type: { type: String, enum:["like", "dislike", "happy", "sad"]},
            author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, //Reacting user
            timestamp:  { type: Date, default: Date.now } //Reaction timestamp.
        });

        /**
         * The reactions to that post/news
         * [like, happy, sad, awesome]
         */
        var newsItemComment = new mongoose.Schema({
            text: {type: String},
            author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, //Reacting user
            timestamp:  { type: Date, default: Date.now } //Reaction timestamp.
        });

        /**
         * The actual news item information contained
         */
        var newsItemInfo = new mongoose.Schema({
            image: {type: String, default:null},
            text: {type: String, default:null}
        });

        /**
         * News Wall Schema.
         * Will store the information of the news wall. Either by customer or by group.
         * There will be no individual news wall.
         */
        var newsItemSchema = new mongoose.Schema({
                customer:   { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
                group:   { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
                author:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
                info: newsItemInfo,
                reactions: [newsItemReaction],
                comments: [newsItemComment],
                createdAt:  { type: Date, default: Date.now },
                updatedAt:  { type: Date, default: Date.now }
            },

            { collection: 'News' }
        );

        /**
         * Virtual attribute to calculate comment count
         */
        newsItemSchema.virtual('commentCount').get(function(){
            return this.comments.length;
        });


        /**
         * Virtual attribute to calculate likes count
         */
        newsItemSchema.virtual('likesCount').get(function(){
            var likeReactions = _.filter(this.reactions, function(r){
                return r.type == 'like'
            });

            return likeReactions.length;
        });

        /**
         * Virtual attribute to get only like reactions.
         */
        newsItemSchema.virtual('likes').get(function(){
            var likeReactions = _.filter(this.reactions, function(r){
                return r.type == 'like'
            })

            return likeReactions;
        });


        newsItemSchema.set('toObject', { virtuals: true });
        newsItemSchema.set('toJSON', { virtuals: true });

        //Define indexes
        newsItemSchema.index({ createdAt: -1 });

        newsItemSchema.pre('save', function(next){
            this.updatedAt = Date.now();
            next();
        });

        newsItemSchema.pre('update', function() {
            this.update({}, { $set: { updatedAt: new Date() } });
        });

        var NewsItem = mongoose.model('NewsItem', newsItemSchema);
        module.exports = NewsItem;

}).call(this);
