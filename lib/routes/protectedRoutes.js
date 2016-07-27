(function () {
    'use strict';

    var coreRoutes = require('../modules/core/coreRoutes');
    var mailingRoutes = require('../modules/mailing/mailingRoutes');
    var statusMailRoutes = require('../modules/mailing/statusMailRoutes');
    var userRoutes = require('../modules/users/userRoutes');
    var emailRoutes = require('../modules/emails/emailRoutes');
    var branchRoutes = require('../modules/branches/branchRoutes');
    var groupRoutes = require('../modules/groups/groupRoutes');
    var achievementRoutes = require('../modules/achievements/achievementRoutes');
    var attendanceRoutes = require('../modules/attendance/attendanceRoutes');
    var customerRoutes = require('../modules/customers/customerRoutes');
    var eventRoutes = require('../modules/events/eventRoutes');
    var houseRoutes = require('../modules/houses/houseRoutes');
    var messageRoutes = require('../modules/messages/messageRoutes');
    var statisticsRoutes = require('../modules/statistics/statisticsRoutes');
    var traitRoutes = require('../modules/traits/traitRoutes');
    var questRoutes = require('../modules/quests/questRoutes');
    var roleRoutes = require('../modules/roles/roleRoutes');

    var express = require('express');
    var expressJwt = require('express-jwt');
    var config = require('../config');
    var router = express.Router();

    router.use(expressJwt({secret: config.jwt_secret}));

    router = coreRoutes.appendRoutes(router);
    router = mailingRoutes.appendRoutes(router);
    router = statusMailRoutes.appendRoutes(router);
    router = userRoutes.appendRoutes(router);
    router = emailRoutes.appendRoutes(router);
    router = branchRoutes.appendRoutes(router);
    router = groupRoutes.appendRoutes(router);
    router = achievementRoutes.appendRoutes(router);
    router = attendanceRoutes.appendRoutes(router);
    router = customerRoutes.appendRoutes(router);
    router = eventRoutes.appendRoutes(router);
    router = houseRoutes.appendRoutes(router);
    router = messageRoutes.appendRoutes(router);
    router = statisticsRoutes.appendRoutes(router);
    router = traitRoutes.appendRoutes(router);
    router = questRoutes.appendRoutes(router);
    router = roleRoutes.appendRoutes(router);

    module.exports = router;

}).call(this);
