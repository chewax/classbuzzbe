(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var deepPopulate = require('mongoose-deep-populate')(mongoose);


    /**
     * Customer Locale Schema
     * Will store the customer's locale info.
     */
    var customerLocale = new mongoose.Schema({
        code: {type: String},
        timezone: {type: String}
    });


    /**
     * Customer Address Schema
     * Will store the customer's address.
     */
    var customerAddress = new mongoose.Schema({
        street:     {type: String, default:null},
        number:     {type: String, default:null},
        city:       {type: String, default:null},
        state:      {type: String, default:null},
        zip:        {type: String, default:null},
        country:    {type: String, default:null}
    });


    /**
     * Customer Base Schema
     */
    var customerSchema = new mongoose.Schema({

        name:           {type: String, default:null},
        email:          {type: String, default:null},
        phoneNumber:    {type: String, default:null},
        logoURL:        {type: String, default:null},
        locale:         customerLocale,

        address: customerAddress,

        houses: [{type: mongoose.Schema.Types.ObjectId, ref: 'House'}],
        lastSorted: {type: mongoose.Schema.Types.ObjectId, ref: 'House',  default: null}

    },
    {
        collection: 'Customers'
    }
    );

    var options = {
        populate: {
            'houses' : {select:'head name score'},
            'houses.head' : {select:'firstName lastName'}
        }
    };

    customerSchema.plugin(deepPopulate, options);

    var Customer = mongoose.model('Customer', customerSchema);

    module.exports =  Customer;

}).call(this);