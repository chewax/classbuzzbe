(function () {

    'use strict';

    var mongoose = require('../../database').Mongoose;
    var moment = require('moment');


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

    var CBLicensePackage = new mongoose.Schema({
        name:       {type: String, default: "Full Price"},
        basePrice:  {type: Number, default: 10},
        discount:   {type: Number, default: 0},
        amount:     {type: Number, default: 1}
    });

    var customerAgreement = new mongoose.Schema({
        licenses:   [CBLicensePackage],
        validFrom:  {type: Date, default: Date.now},
        validTo:    {type: Date, default: null}
    });


    customerAgreement.virtual('totalPrice').get(function(){
        var price = 0;
        this.licenses.forEach(function(l){
            var licensePrice = l.basePrice * l.amount;
            licensePrice = licensePrice - (l.discount * licensePrice)/100;
            price += licensePrice;
        });

        return price;
    });


    customerAgreement.virtual('totalLicenses').get(function(){
        var lics = 0;
        this.licenses.forEach(function(l){
            lics += l.amount;
        });

        return lics;
    });

    customerAgreement.set('toObject', { virtuals: true });
    customerAgreement.set('toJSON', { virtuals: true });


    /**
     * Customer Base Schema
     */
    var customerSchema = new mongoose.Schema({

        name:           {type: String, default:null},
        email:          {type: String, default:null},
        phoneNumber:    {type: String, default:null},
        logoURL:        {type: String, default:null},
        settings:       [customerSetting],
        address:        customerAddress,
        agreements:     [customerAgreement]
    },
    {
        collection: 'Customers'
    }
    );


    customerSchema.virtual('currentAgreements').get(function(){
        var agr = [];

        this.agreements.forEach(function(a){
            if ( a.validFrom >= Date.now() && Date.now() <= a.validTo) {
                agr.push(a);
            }
        });

        return agr;
    });

    customerSchema.virtual('maxLicensesAllowed').get(function(){
        var lics = 0;

        this.currentAgreements.forEach(function(a){
            lics += a.totalLicenses;
        });

        return lics;
    });




    /**
     * Virtual Attribute to get house students
     */
    customerSchema.virtual('houses', {
        ref: 'House',
        localField: '_id',
        foreignField: 'customer'
    });


    //For Virtual Fields
    customerSchema.set('toObject', { virtuals: true });
    customerSchema.set('toJSON', { virtuals: true });


    var Customer = mongoose.model('Customer', customerSchema);

    module.exports =  Customer;

}).call(this);