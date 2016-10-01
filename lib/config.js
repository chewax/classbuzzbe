(function () {
    'use strict';

    var fs = require('fs');
    require('dotenv').config();

    module.exports = {

        houses: {
            xpPointsRatio: 0.1
        },

        skills: {
            xpPointsRatio: 0.2
        },

        mongo_connection: {
            username: process.env.DB_USER,
            password: process.env.DB_PASS,
            url: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_COLL
        },

        mailer: {
            pass_recovery_url: '/api/v1/credentials/reset/',
            pass_recovery_token_ttl: 60 * 60 * 1000, //1 hour,
            contact_email:'support@classbuzz.edu.uy',
            from_field: 'no-reply@classbuzz.edu.uy'
        },

        mailgun: {
            apiKey:process.env.MAILGUN_API_KEY,
            domain:'classbuzz.edu.uy'
        },

        server : {
            port: (process.env.PORT || 5000)
        },

        jwt_secret: process.env.JWT_SECRET,
        jwt_expiration: 60*5, // 5 hours
        salt_work_factor: 10,
        
        baseURL: process.env.BASE_URL,
        apiVersion: '/api/v1',

        quests: {
            respawnTime: 3 //days [ -1: every time | 0: never ]
        },

        S3 : {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            bucket: 'pyromancer.co.gg.images',
            endpoint:'s3-sa-east-1.amazonaws.com',
            base: "http://pyromancer.co.gg.images.s3.amazonaws.com/"
        },

        default_avatar: {
            male: fs.readFileSync(__dirname +  '/public/avatars/maleAvatar.txt') ,
            female: fs.readFileSync( __dirname +  '/public/avatars/femaleAvatar.txt')
        },

        statusModifiers: ["goldGained", "xpGained", "xpLost", "houseContribution", "questSlots"],
        statusEffectPower: ['lesser', 'minor', 'normal', 'mayor', 'greater', 'mighty'],
        characterWearables: ['eyes', 'head', 'chest', 'legs', 'feet', 'leftHand', 'rightHand', 'companionRight', 'companionLeft'],
        characterPlacements:['eyes', 'head', 'chest', 'legs', 'feet', 'leftHand', 'rightHand', 'companionRight', 'companionLeft', 'mouth', 'facialHair', 'hair', 'eyebrow', 'upperBody', 'lowerBody'],
        alreadyOwnedItemGoldRate: 0.2

    }

}).call(this);
