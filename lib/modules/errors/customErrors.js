(function () {
    'use strict';

    var messages = require('./../core/systemMessages');

    module.exports.notFoundError = NotFoundError;
    module.exports.mildError = MildError;
    module.exports.severeError = SevereError;
    module.exports.userNotFound = UserNotFoundError;
    module.exports.notEnoughMoney = NotEnoughMoneyError;
    module.exports.traitAlreadyOwned = TraitAlreadyOwnedError;
    module.exports.notAuthorizedError = NotAuthorizedError;

    /**
     * Not Found Custom Error - Inherits from Error.
     * @param errorMessage String
     * @param [userMessage] String
     * @param [statusCode] int
     */
    function NotFoundError(errorMessage, userMessage, statusCode){
        this.constructor.prototype.__proto__ = Error.prototype;
        this.name = this.constructor.name;
        this.message = errorMessage;
        this.statusCode = typeof statusCode !== 'undefined' ?  statusCode : 404;
        this.userMessage = typeof userMessage !== 'undefined' ?  userMessage : messages.generic();
        Error.captureStackTrace(this, NotFoundError);
    }

    /**
     * Mild Custom Error - Inherits from Error.
     * @param errorMessage String
     * @param [userMessage] String
     * @param [statusCode] int
     */
    function MildError (errorMessage, userMessage, statusCode) {
        this.constructor.prototype.__proto__ = Error.prototype;
        this.name = this.constructor.name;
        this.message = errorMessage;
        this.statusCode = typeof statusCode !== 'undefined' ?  statusCode : 500;
        this.userMessage = typeof userMessage !== 'undefined' ?  userMessage : messages.generic();
        Error.captureStackTrace(this, MildError);
    };

    /**
     * Severe Custom Error - Inherits from Error.
     * @param errorMessage String
     * @param [userMessage] String
     * @param [statusCode] int
     */
    function SevereError (errorMessage, userMessage, statusCode) {
        this.constructor.prototype.__proto__ = Error.prototype;
        this.name = this.constructor.name;
        this.message = errorMessage;
        this.statusCode = typeof statusCode !== 'undefined' ?  statusCode : 500;
        this.userMessage = typeof userMessage !== 'undefined' ?  userMessage : messages.generic();
        Error.captureStackTrace(this, SevereError);
    };


    /**
     * User not found error
     * @param [statusCode] int
     */
    function  UserNotFoundError (statusCode) {
        this.constructor.prototype.__proto__ = Error.prototype;
        this.name = this.constructor.name;
        this.message = "User Not Found";
        this.statusCode = typeof statusCode !== 'undefined' ?  statusCode : 404;
        this.userMessage = messages.data.dontExist('User');
        Error.captureStackTrace(this, UserNotFoundError);
    };


    /**
     * Not Enough Money
     * @param [statusCode] int
     */
    function NotEnoughMoneyError () {
        this.constructor.prototype.__proto__ = Error.prototype;
        this.name = this.constructor.name;
        this.message = "Not enough doubloons to complete the purchase";
        this.statusCode = 402;
        this.userMessage = messages.info.custom("You haven't got enough doubloons to perfomr that purchase.");
        Error.captureStackTrace(this, NotEnoughMoneyError);
    };


    /**
     * Already owns item
     * @param [statusCode] int
     */
    function TraitAlreadyOwnedError () {
        this.constructor.prototype.__proto__ = Error.prototype;
        this.name = this.constructor.name;
        this.message = "Trait already owend";
        this.statusCode = 406;
        this.userMessage = messages.info.custom("You already own that item.");
        Error.captureStackTrace(this, TraitAlreadyOwnedError);
    };

    /**
     * Not Authorized error
     * @param errorMessage
     * @param [userMessage]
     */
    function NotAuthorizedError (errorMessage, userMessage) {
        this.constructor.prototype.__proto__ = Error.prototype;
        this.name = this.constructor.name;
        this.message = errorMessage;
        this.statusCode = 401;
        this.userMessage = typeof userMessage !== 'undefined' ?  userMessage : messages.auth.notAuthorized();
        Error.captureStackTrace(this, NotAuthorizedError);
    };


}).call(this);