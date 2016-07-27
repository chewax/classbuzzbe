(function () {
    'use strict';

    var logger = require('../log/logger').getLogger();
    var utils = require('../core/utils');
    var _ = require('underscore');

    module.exports = function (roles){

        return function (req, res, next) {

            // Inject super-admin to all paths - super-admin is allowed to anything
            roles.push("super-admin");

            //Parse user roles names
            var userRoles = req.user.roles.map(function(r) { return r.name });

            // Intersection between user roles and required roles
            var matchingRoles = _.intersection(userRoles,roles);

            if (matchingRoles.length > 0) {
                next();
            }

            else {

                logger.warn("Unauthorized access attempt to: ["+ req.url +"] by user: " + JSON.stringify(req.user));
                res.status(401).send("Not authorized to access this section");
                return;
            }
        }
    }

}).call(this);