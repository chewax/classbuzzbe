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
    var newsItemRoutes = require('../modules/news/newsItemRoutes');
    var attendanceRoutes = require('../modules/attendance/attendanceRoutes');
    var customerRoutes = require('../modules/customers/customerRoutes');
    var eventRoutes = require('../modules/events/eventRoutes');
    var houseRoutes = require('../modules/houses/houseRoutes');
    var notificationRoutes = require('../modules/notifications/notificationRoutes');
    var statisticsRoutes = require('../modules/statistics/statisticsRoutes');
    var statusEffectRoutes = require('../modules/statusEffect/statusEffectRoutes');
    var attributeRoutes = require('../modules/attributes/attributeRoutes');
    var traitRoutes = require('../modules/traits/traitRoutes');
    var questRoutes = require('../modules/quests/questRoutes');
    var roleRoutes = require('../modules/roles/roleRoutes');
    var authRoutes = require('../modules/access/authRoutes');
    var statPropRoutes = require('../modules/statProps/statPropRoutes');
    var errorRoutes = require('../modules/errors/errorRoutes');

    var express = require('express');
    var router = express.Router();

    router = coreRoutes.appendPublicRoutes(router);
    router = mailingRoutes.appendPublicRoutes(router);
    router = statusMailRoutes.appendPublicRoutes(router);
    router = userRoutes.appendPublicRoutes(router);
    router = emailRoutes.appendPublicRoutes(router);
    router = branchRoutes.appendPublicRoutes(router);
    router = groupRoutes.appendPublicRoutes(router);
    router = activityRoutes.appendPublicRoutes(router);
    router = achievementRoutes.appendPublicRoutes(router);
    router = rankRoutes.appendPublicRoutes(router);
    router = skillRoutes.appendPublicRoutes(router);
    router = newsItemRoutes.appendPublicRoutes(router);
    router = attendanceRoutes.appendPublicRoutes(router);
    router = customerRoutes.appendPublicRoutes(router);
    router = eventRoutes.appendPublicRoutes(router);
    router = houseRoutes.appendPublicRoutes(router);
    router = notificationRoutes.appendPublicRoutes(router);
    router = statisticsRoutes.appendPublicRoutes(router);
    router = statusEffectRoutes.appendPublicRoutes(router);
    router = attributeRoutes.appendPublicRoutes(router);
    router = traitRoutes.appendPublicRoutes(router);
    router = questRoutes.appendPublicRoutes(router);
    router = roleRoutes.appendPublicRoutes(router);
    router = authRoutes.appendPublicRoutes(router);
    router = errorRoutes.appendPublicRoutes(router);
    router = statPropRoutes.appendPublicRoutes(router);

    module.exports = router;

}).call(this);
