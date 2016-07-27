(function () {
    'use strict';

    // ROLES
    // super-admin (full control)
    // customer-admin (customer)
    // branch-admin (branch)
    // sub-branch-admin (school) //branches have several "independent schools"
    // teacher
    // student
    // parent

    var logger = require('../log/logger').getLogger();
    var roleModel = require('../roles/roleModel');
    var messages = require('../core/systemMessages');
    var customErr = require('../errors/customErrors');

    /**
     * Calculates if given user has given role
     * @function
     * @param  {User} user
     * @param  {String} role
     * @return {Boolean}
     */
    module.exports.hasRole  = function (user, role) {
        return false;
    }

    /**
     * Calculates if the given user may grant a given role.
     * @function
     * @param  {User} user
     * @param  {String} role
     * @return {Boolean}
     */
    module.exports.mayGrant = function (user, role) {

        // basic config, what can each role grant.
        var superAdmin = ['super-admin', 'customer-admin', 'branch-admin', 'sub-branch-admin', 'teacher', 'student', 'parent'];
        var customerAdmin = ['branch-admin', 'sub-branch-admin', 'teacher', 'student', 'parent'];
        var branchAdmin = ['sub-branch-admin-admin', 'teacher', 'student', 'parent'];
        var subBranchAdmin = ['teacher', 'student', 'parent'];
        var teacher = [];
        var student = [];
        var parent = [];

        return false;
    }


    /**
     * Checks if the user is good to go. If exists, and has all the roles needed to perform the operation
     * @param user - User to be checked
     * @param neededRoles - All the roles are needed
     * @returns {Promise}
     */
    module.exports.userHasRoles = function(user, neededRoles) {
        return new Promise( function (resolve, reject) {

            // Check if user passed exists.
            if (!user) {
                var e = new customErr.userNotFound();
                reject(e);

            } else {

                // If neededRoles are roles to check.
                if (neededRoles) {

                    // For each role in list check if the user has it.
                    neededRoles.forEach( function (r) {

                        if (!user.hasRole(r)) {

                            var e = new customErr.mildError(
                                "Cannot perform action: missing role " + r,
                                messages.auth.missingRole("Missing role: " + r),
                                401);

                            reject(e);

                        }

                    });
                }

                resolve(user);

            }

        });

    }

}).call(this);