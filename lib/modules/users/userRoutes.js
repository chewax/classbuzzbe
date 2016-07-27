(function(){

    var allow = require('../access/accessMiddleware');
    var userController = require('./userController');

    module.exports.appendRoutes = function(router){

        // GETs
        // =====================================================
        router.get('/users/all', allow(["customer-admin", "branch-admin", "teacher", "student"]), userController.find.all);
        router.get('/users/:doc/character', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.character.get);
        router.get('/users/:doc/username', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.getUsername);
        router.get('/users/:doc/children', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.parent.findChildren);
        router.get('/users/:doc/branches', allow(["branch-admin", "customer-admin"]), userController.branches.all);
        router.get('/users/:doc/activity', allow(["branch-admin", "customer-admin"]), userController.activity.all);
        router.get('/users/:doc/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), userController.groups.all);
        router.get('/users/:doc/leaderboard', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.leaderboards);
        router.get('/users/:doc/quest/all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.quests.all);
        router.get('/users/:doc/quest/achievements/all', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.quests.allWithAchievement);
        router.get('/users/status', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.status.get);
        router.get('/users/:id/public', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.publicProfile);
        router.get('/users/:id/messages', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.messages);
        router.get('/users/:doc/character/achievements', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.achievement.all);
        router.get('/users/:doc/inventory', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.traits.inventory);
        router.get('/users/:doc/traits', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.traits.all);
        router.get('/users/:doc/students', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findByTeacher);
        router.get('/users/:doc/teachers', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findTeachers);
        router.get('/users/:doc/group-student', allow(["branch-admin", "customer-admin", "teacher"]), userController.find.popGroup);
        router.get('/users/:doc/students/paginate', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findByTeacher);
        router.get('/users/:doc', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.one);

        // POST
        // =====================================================
        router.post('/users/create', allow(["customer-admin", "branch-admin"]), userController.newUser);
        router.post('/users/update', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.update);
        router.post('/users/status', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.status.set);
        router.post('/users/avatar/update', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.updateAvatarURL);
        router.post('/users/remove', allow(["customer-admin", "branch-admin"]), userController.remove);
        router.post('/users/search', allow(["customer-admin", "branch-admin", "teacher"]), userController.find.autocomplete);
        router.post('/users/paginate', allow(["customer-admin", "branch-admin", "teacher"]), userController.find.paginate);
        router.post('/users/notInGroup', allow(["customer-admin", "branch-admin", "teacher"]), userController.find.studentNotInGroup);
        router.post('/users/password/update', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student", "parent"]),userController.updatePassword);
        router.post('/users/:doc/username/reset', allow(["customer-admin", "branch-admin"]),userController.resetUsername);
        router.post('/users/:doc/password/reset', allow([]),userController.resetPassword);
        router.post('/users/:doc/trait/buy', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student", "parent"]),userController.traits.buy);
        router.post('/users/:doc/branches/update', allow(["customer-admin", "branch-admin"]), userController.branches.update);
        router.post('/users/:doc/roles/add', allow(["customer-admin", "branch-admin", "sub-branch-admin"]), userController.role.add);
        router.post('/users/:doc/roles/remove', allow(["customer-admin", "branch-admin", "sub-branch-admin"]), userController.role.remove);
        router.post('/users/:doc/groups/add', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), userController.groups.add);
        router.post('/users/:doc/groups/createAndAdd', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), userController.groups.createAndAdd);
        router.post('/users/:doc/groups/remove', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]),userController.groups.remove);
        router.post('/users/:doc/achievements/recent', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]),userController.achievement.find);
        router.post('/users/:doc/house/update', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student"]), userController.house.update);
        router.post('/users/:doc/children/add', allow(["customer-admin", "branch-admin"]), userController.children.add);
        router.post('/users/:doc/children/remove', allow(["customer-admin", "branch-admin"]), userController.children.remove);
        router.post('/users/:doc/children/:child_doc/parentalControl/update', allow(["customer-admin", "branch-admin", "parent"]), userController.children.updateParentalControl);
        router.post('/users/:doc/activity/query', allow(["branch-admin", "customer-admin"]), userController.activity.query);

        //CHARACTER
        router.post('/users/:doc/character/add', allow(["student"]), userController.character.create); //Create new char
        router.post('/users/:doc/character/update', allow(["student"]),  userController.character.update); //Update Existing Char
        router.post('/users/:doc/character/xp/add', allow(["customer-admin", "branch-admin", "teacher"]), userController.character.addXP);
        router.post('/users/:doc/character/xp/remove', allow(["customer-admin", "branch-admin", "teacher"]), userController.character.delXP);
        router.post('/users/:doc/character/achievements/add', allow(["customer-admin", "branch-admin", "teacher"]), userController.achievement.add);
        router.post('/users/:doc/character/achievements/remove', allow(["customer-admin", "branch-admin", "teacher"]), userController.achievement.remove);

        //QUESTS
        router.post('/users/:doc/quest/add', allow(["customer-admin", "branch-admin"]), userController.quests.add);
        router.post('/users/:doc/quest/remove', allow(["customer-admin", "branch-admin"]), userController.quests.remove);

        return router;
    }

}).call(this);
