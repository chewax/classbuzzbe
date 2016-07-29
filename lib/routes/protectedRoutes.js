(function () {
    'use strict';

    var coreRoutes = require('../modules/core/coreRoutes');
    var mailingRoutes = require('../modules/mailing/mailingRoutes');
    var statusMailRoutes = require('../modules/mailing/statusMailRoutes');
    var userRoutes = require('../modules/users/userRoutes');
    var emailRoutes = require('../modules/emails/emailRoutes');
    var branchRoutes = require('../modules/branches/branchRoutes');
    var groupRoutes = require('../modules/groups/groupRoutes');
    var activityRoutes = require('../modules/activities/activityRoutes');
    var achievementRoutes = require('../modules/achievements/achievementRoutes');
    var rankRoutes = require('../modules/ranks/rankRoutes');
    var skillRoutes = require('../modules/skills/skillRoutes');
    var attendanceRoutes = require('../modules/attendance/attendanceRoutes');
    var customerRoutes = require('../modules/customers/customerRoutes');
    var eventRoutes = require('../modules/events/eventRoutes');
    var houseRoutes = require('../modules/houses/houseRoutes');
    var messageRoutes = require('../modules/messages/messageRoutes');
    var statisticsRoutes = require('../modules/statistics/statisticsRoutes');
    var traitRoutes = require('../modules/traits/traitRoutes');
    var questRoutes = require('../modules/quests/questRoutes');
    var roleRoutes = require('../modules/roles/roleRoutes');
    var authRoutes = require('../modules/access/authRoutes');
    var errorRoutes = require('../modules/errors/errorRoutes');

    var express = require('express');
    var expressJwt = require('express-jwt');
    var config = require('../config');
    var router = express.Router();

    router.use(expressJwt({secret: config.jwt_secret}));

    router = coreRoutes.appendProtectedRoutes(router);
    router = mailingRoutes.appendProtectedRoutes(router);
    router = statusMailRoutes.appendProtectedRoutes(router);
    router = userRoutes.appendProtectedRoutes(router);
    router = emailRoutes.appendProtectedRoutes(router);
    router = branchRoutes.appendProtectedRoutes(router);
    router = groupRoutes.appendProtectedRoutes(router);
    router = activityRoutes.appendProtectedRoutes(router);
    router = achievementRoutes.appendProtectedRoutes(router);
    router = rankRoutes.appendProtectedRoutes(router);
    router = skillRoutes.appendProtectedRoutes(router);
    router = attendanceRoutes.appendProtectedRoutes(router);
    router = customerRoutes.appendProtectedRoutes(router);
    router = eventRoutes.appendProtectedRoutes(router);
    router = houseRoutes.appendProtectedRoutes(router);
    router = messageRoutes.appendProtectedRoutes(router);
    router = statisticsRoutes.appendProtectedRoutes(router);
    router = traitRoutes.appendProtectedRoutes(router);
    router = questRoutes.appendProtectedRoutes(router);
    router = roleRoutes.appendProtectedRoutes(router);
    router = errorRoutes.appendProtectedRoutes(router);
    router = authRoutes.appendProtectedRoutes(router);

    module.exports = router;

}).call(this);
