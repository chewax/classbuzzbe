(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;


    /**
     * Will store customer's settings
     */
    var customerSetting = new mongoose.Schema({
        name: {type:String, default: 'null'},
        value: {type: mongoose.Schema.Types.Mixed, default: null}
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
        settings:       [customerSetting],

        address: customerAddress,
        lastSorted: {type: mongoose.Schema.Types.ObjectId, ref: 'House',  default: null}

    },
    {
        collection: 'Customers'
    }
    );

    /**
     * Virtual Attribute to get house students
     */
    customerSchema.virtual('houses', {
        ref: 'Houses',
        localField: '_id',
        foreignField: 'customer'
    });


    //For Virtual Fields
    customerSchema.set('toObject', { virtuals: true });
    customerSchema.set('toJSON', { virtuals: true });


    var Customer = mongoose.model('Customer', customerSchema);

    module.exports =  Customer;

}).call(this);