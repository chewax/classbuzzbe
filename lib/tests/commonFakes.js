
'use strict';

module.exports.fakeConsole = {
    errors: [],
    logs: [],
    error: function (msg, value) {
        this.errors.push({msg: msg, value: value});
    },
    log: function (msg, value) {
        this.logs.push({msg: msg, value: value});
    }
};


module.exports.fakeRequest = {
    body: {},
    params: {},
    user: {
        id: "1",
        doc: "222",
        firstName: "Kakashi",
        lastName: "Hatake",
        email: "shinobi@delahoja.com",
        roles: ["55f7275d502e2ada92fad7cd"],
        branch: ["560086e38c5ec8d121789905"],
        customer: ["560086e38c5ec8d121789905"],
        avatarURL: "theavatarurl.com",
        gender: "M"
    }
};


module.exports.fakeConfig = {

    houses: {
        xpPointsRatio: 0.1
    },

    mongo_connection: {
        username: "dbuser",
        password: "dbpass",
        url: "dbhost",
        port: "dbport",
        database: "dbcoll"
    },

    mailer: {
        pass_recovery_url: '/api/v1/credentials/reset/',
        pass_recovery_token_ttl: 60 * 60 * 1000, //1 hour,
        contact_email:'support@classbuzz.edu.uy',
        from_field: 'no-reply@classbuzz.edu.uy'
    },

    mailgun: {
        apiKey:'mailgun_api_key',
        domain:'classbuzz.edu.uy'
    },

    server : {
        port: 5000
    },

    jwt_secret: 'jwt_secret',
    jwt_expiration: 60*5, // 5 hours
    salt_work_factor: 10,

    baseURL: 'http://apibaseurl',
    apiVersion: '/api/v1',

    quests: {
        respawnTime: 1 //days
    },

    S3 : {
        accessKeyId: 's3accesskey',
        secretAccessKey: 's3secret',
        bucket: 'pyromancer.co.gg.images',
        endpoint:'s3-sa-east-1.amazonaws.com',
        base: "http://pyromancer.co.gg.images.s3.amazonaws.com/"
    }
};


module.exports.fakeSystemMessages = {}
