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
    var seasonRoutes = require('../modules/seasons/seasonRoutes');
    var chestRoutes = require('../modules/chests/chestRoutes');
    var newsItemRoutes = require('../modules/news/newsItemRoutes');
    var attendanceRoutes = require('../modules/attendance/attendanceRoutes');
    var customerRoutes = require('../modules/customers/customerRoutes');
    var eventRoutes = require('../modules/events/eventRoutes');
    var houseRoutes = require('../modules/houses/houseRoutes');
    var notificationRoutes = require('../modules/notifications/notificationRoutes');
    var statisticsRoutes = require('../modules/statistics/statisticsRoutes');
    var statusEffectRoutes = require('../modules/statusEffect/statusEffectRoutes');
    var specialEventRoutes = require('../modules/specialEvents/specialEventsRoutes');
    var attributeRoutes = require('../modules/attributes/attributeRoutes');
    var traitRoutes = require('../modules/traits/traitRoutes');
    var questRoutes = require('../modules/quests/questRoutes');
    var roleRoutes = require('../modules/roles/roleRoutes');
    var authRoutes = require('../modules/access/authRoutes');
    var statPropRoutes = require('../modules/statProps/statPropRoutes');
    var errorRoutes = require('../modules/errors/errorRoutes');
    var reportRoutes = require('../modules/reports/reportRoutes');

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
    router = seasonRoutes.appendProtectedRoutes(router);
    router = chestRoutes.appendProtectedRoutes(router);
    router = newsItemRoutes.appendProtectedRoutes(router);
    router = attendanceRoutes.appendProtectedRoutes(router);
    router = customerRoutes.appendProtectedRoutes(router);
    router = eventRoutes.appendProtectedRoutes(router);
    router = houseRoutes.appendProtectedRoutes(router);
    router = notificationRoutes.appendProtectedRoutes(router);
    router = statisticsRoutes.appendProtectedRoutes(router);
    router = statusEffectRoutes.appendProtectedRoutes(router);
    router = specialEventRoutes.appendProtectedRoutes(router);
    router = attributeRoutes.appendProtectedRoutes(router);
    router = traitRoutes.appendProtectedRoutes(router);
    router = questRoutes.appendProtectedRoutes(router);
    router = roleRoutes.appendProtectedRoutes(router);
    router = errorRoutes.appendProtectedRoutes(router);
    router = authRoutes.appendProtectedRoutes(router);
    router = statPropRoutes.appendProtectedRoutes(router);
    router = reportRoutes.appendProtectedRoutes(router);

    module.exports = router;

}).call(this);
