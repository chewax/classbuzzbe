(function(){

    var allow = require('../access/accessMiddleware');
    var userController = require('./userController');

    module.exports.appendProtectedRoutes = function(router){

        // GETs
        // =====================================================
        router.get('/users', allow(["customer-admin", "branch-admin", "teacher", "student"]), userController.find.all);
        router.get('/users/:id/character', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.character.get);
        router.get('/users/:id/username', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.getUsername);
        router.get('/users/:id/children', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.parent.findChildren);
        router.get('/users/:id/branches', allow(["branch-admin", "customer-admin"]), userController.branches.all);
        router.get('/users/:id/activity', allow(["branch-admin", "customer-admin"]), userController.activity.all);
        router.get('/users/:id/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), userController.groups.all);
        router.get('/users/:id/leaderboard', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.leaderboards);
        router.get('/users/:id/quest', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.quests.all);
        router.get('/users/status', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.status.get);
        router.get('/users/:id/public', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.publicProfile);
        router.get('/users/:id/messages', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.messages);
        router.get('/users/:id/character/activities', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.activity.all);
        router.get('/users/:id/inventory', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.traits.inventory);
        router.get('/users/:id/traits', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.traits.all);
        router.get('/users/:id/students', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findByTeacher);
        router.get('/users/:id/teachers', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findTeachers);
        router.get('/users/:id/group-student', allow(["branch-admin", "customer-admin", "teacher"]), userController.find.popGroup);
        router.get('/users/:id/students/paginate', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findByTeacher);
        router.get('/users/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.one);

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
        router.post('/users/:id/username/reset', allow(["customer-admin", "branch-admin"]),userController.resetUsername);
        router.post('/users/:id/password/reset', allow([]),userController.resetPassword);
        router.post('/users/:id/trait/buy', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student", "parent"]),userController.traits.buy);
        router.post('/users/:id/branches/update', allow(["customer-admin", "branch-admin"]), userController.branches.update);
        router.post('/users/:id/roles/add', allow(["customer-admin", "branch-admin", "sub-branch-admin"]), userController.role.add);
        router.post('/users/:id/roles/remove', allow(["customer-admin", "branch-admin", "sub-branch-admin"]), userController.role.remove);
        router.post('/users/:id/groups/add', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), userController.groups.add);
        router.post('/users/:id/groups/createAndAdd', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), userController.groups.createAndAdd);
        router.post('/users/:id/groups/remove', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]),userController.groups.remove);
        //router.post('/users/:id/activities/recent', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]),userController.activity.find);
        router.post('/users/:id/house/update', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student"]), userController.house.update);
        router.post('/users/:id/children/add', allow(["customer-admin", "branch-admin"]), userController.children.add);
        router.post('/users/:id/children/remove', allow(["customer-admin", "branch-admin"]), userController.children.remove);
        router.post('/users/:id/children/:child_doc/parentalControl/update', allow(["customer-admin", "branch-admin", "parent"]), userController.children.updateParentalControl);
        router.post('/users/:id/activity/query', allow(["branch-admin", "customer-admin"]), userController.activity.query);

        //CHARACTER
        router.post('/users/:id/character/add', allow(["student"]), userController.character.create); //Create new char
        router.post('/users/:id/character/update', allow(["student"]),  userController.character.update); //Update Existing Char
        router.post('/users/:id/character/xp/add', allow(["customer-admin", "branch-admin", "teacher"]), userController.character.addXP);
        router.post('/users/:id/character/xp/remove', allow(["customer-admin", "branch-admin", "teacher"]), userController.character.delXP);
        //router.post('/users/:id/character/activities/add', allow(["customer-admin", "branch-admin", "teacher"]), userController.activity.add);
        //router.post('/users/:id/character/activities/remove', allow(["customer-admin", "branch-admin", "teacher"]), userController.activity.remove);

        //QUESTS
        router.post('/users/:id/quest/add', allow(["customer-admin", "branch-admin"]), userController.quests.add);
        router.post('/users/:id/quest/remove', allow(["customer-admin", "branch-admin"]), userController.quests.remove);

        return router;
    }

    module.exports.appendPublicRoutes = function(router){
        router.get('/users/exist/:id' , userController.find.exists);
        router.post('/students/create', userController.newStudent);
        router.post('/parents/create', userController.parent.new);
        return router;
    }

}).call(this);
