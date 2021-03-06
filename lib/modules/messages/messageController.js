(function(){
    'use strict';

    var messageModel = require('./messageModel');
    var userModel = require('../users/userModel');
    var errorHandler = require('../errors/errorHandler');
    var _ = require('lodash');

    module.exports.newMessage = newMessage;

    module.exports.editMessage = function(req, res) {
        var element_id = req.body._id;
        delete req.body._id;
        var data = req.body;
        messageModel.findByIdAndUpdate(element_id, data)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }


    module.exports.deleteMessage = function(req, res) {
        messageModel.findByIdAndRemove(req.params.id)
            .then (function (result) { res.status(200).json(result) })
            .catch(function (err) { errorHandler.handleError(err, req, res)});
    }

    module.exports.getConversation = function(req, res) {
        getConversationBetween(req.query.user1, req.query.user2)
            .then(function(result){
                res.status(200).json(result);
            })
            .catch(function(err){
                errorHandler.handleError(err, req, res);
            })
    };

    module.exports.getBoard = function(req, res) {

        getBoard(req.params.id, req.query.like)
            .then(function(result){
                res.status(200).json(result);
            })
            .catch(function(err){
                errorHandler.handleError(err, req, res);
            })
    };

    module.exports.enqueueMessage = function (req, res) {
        req.body.type = 'statusMail';

        newMessage (req.body)
            .then(function(result){
                res.status(200).json(result);
            })
            .catch(function(err){
                errorHandler.handleError(err, req, res);
            })
    };


    function newMessage (data)  {
        var msg = new messageModel(data);
        return msg.save() .then(function(result){
                var populateQuery = [{path:'to', select:'_id firstName lastName avatarURL'}, {path:'from', select:'_id firstName lastName avatarURL'}];
                return messageModel.populate(result, populateQuery);
            })
    };

    function getConversationBetween(user1, user2){
        var populateQuery = [{path:'to', select:'_id firstName lastName avatarURL'}, {path:'from', select:'_id firstName lastName avatarURL'}];

        return new Promise(function(resolve, reject){
            messageModel.find({
                    $or:
                    [
                        {$and: [{from: user1}, {to:user2}]},
                        {$and: [{to: user1}, {from:user2}]}
                    ]
                })
                .populate(populateQuery)
                .then(function(result){
                    resolve(result);
                })
                .catch(function(err){
                    reject(err);
                })
        })
    };

    function getBoard(userId, searchLike){
        return new Promise(function(resolve, reject){

            userModel.findOne({_id:userId})
            .then(function(_parent){
                return userModel.find({'student.parents.doc':_parent.doc})
            })
            .then(function(_students){
                
                var populateQuery = [{path:'to', select:'_id firstName lastName avatarURL'}, {path:'from', select:'_id firstName lastName avatarURL'}];
                
                var _fromto = [];
                if (_students.length > 0) _fromto = _students.map(function(s){ return s._id});
                _fromto.push(userId);

                var andFilters = [ {$or: [{from: {$in:_fromto}}, {to: {$in:_fromto}} ]} ];
                
                return messageModel.find().and(andFilters).populate(populateQuery)
            })
            .then(function(result){

                var groupedBoard = _.groupBy(result, function(message){
                    if (message.to._id.toString() == userId.toString()) {
                        return JSON.stringify( message.from );
                    }
                    else {
                        return JSON.stringify(message.to);
                    }

                });

                resolve(groupedBoard);
            })
            .catch(function(err){
                reject(err);
            })
        })
    };


}).call(this);
