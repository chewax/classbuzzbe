(function(){

    var allow = require('../access/accessMiddleware');
    var userController = require('./userController');
    var utils = require('../core/utils');

    module.exports.appendProtectedRoutes = function(router){

        // GET
        // =====================================================
        router.get('/users', allow(["customer-admin", "branch-admin", "teacher", "student"]), userController.find.all);
        router.get('/users/lazy', allow(["customer-admin", "branch-admin", "teacher", "student"]), userController.find.lazyLoad);
        router.get('/users/:id/character', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.character.get);
        router.get('/users/:id/username', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.getUsername);
        router.get('/users/:id/children', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.parent.findChildren);
        router.get('/users/:id/activities', allow(["branch-admin", "customer-admin", "teacher", "student", "parent"]), userController.activity.find);
        router.get('/users/:id/leaderboard', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.leaderboards);
        router.get('/users/:id/quests', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.quests.all);
        router.get('/users/:id/status', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.status.get);
        router.get('/users/:id/public', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.publicProfile);
        router.get('/users/:id/achievements', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.achievements.all);
        router.get('/users/:id/avatar', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.getAvatar);
        router.get('/users/:id/inventory', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.traits.inventory);
        router.get('/users/:id/traits', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.traits.all);
        router.get('/users/:id/students', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findByTeacher);
        router.get('/users/:id/teachers', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findTeachers);
        router.get('/users/:id/specialEvents', allow(["branch-admin", "customer-admin", "teacher", "student", "parent"]), userController.student.findSpecialEvents);
        router.get('/users/:id/specialEvents/completed', allow(["branch-admin", "customer-admin", "teacher", "student", "parent"]), userController.student.findCompletedSpecialEvents);
        router.get('/users/:id/students/paginate', allow(["branch-admin", "customer-admin", "teacher"]), userController.student.findByTeacher);
        router.get('/users/:id/settings', allow(["customer-admin", "branch-admin", "parent", "teacher", "student"]), userController.settings.get);
        router.get('/users/:id', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.find.one);

        // POST
        // =====================================================
        router.post('/users', allow(["customer-admin", "branch-admin"]), userController.newUser);
        router.post('/users/:id/status', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.status.set);
        router.post('/users/search', allow(["customer-admin", "branch-admin", "teacher"]), userController.find.autocomplete);
        router.post('/users/paginate', allow(["customer-admin", "branch-admin", "teacher"]), userController.find.paginate);
        router.post('/users/:id/username/reset', allow(["customer-admin", "branch-admin"]),userController.resetUsername);
        router.post('/users/:id/password/reset', allow(["customer-admin", "branch-admin", "teacher"]),userController.resetPassword);
        router.post('/users/:id/trait/buy', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student", "parent"]),userController.traits.buy);
        router.post('/users/:id/specialEvents/:eventId/complete', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student", "parent"]),userController.specialEvents.complete);
        router.post('/users/:id/chests/:chestId/open', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student", "parent"]),userController.openChest);
        router.post('/users/:id/roles/add', allow(["customer-admin", "branch-admin", "sub-branch-admin"]), userController.role.add);
        router.post('/users/:id/activities', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student"]), userController.activity.add);
        
        
        //PUT
        // =====================================================
        router.put('/users', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.update);
        router.put('/users/avatar', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), userController.updateAvatarURL);
        router.put('/users/password', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student", "parent"]),userController.updatePassword);
        router.put('/users/:id/character', allow(["student"]),  userController.character.update); //Update Existing Char
        router.put('/users/:id/house', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student"]), userController.house.update);
        router.put('/users/:id/settings', allow(["customer-admin", "branch-admin", "parent", "teacher", "student"]), userController.settings.update);


        //DELETE
        // =====================================================
        router.delete('/users', allow(["customer-admin", "branch-admin"]), userController.remove);
        router.delete('/users/:id/roles', allow(["customer-admin", "branch-admin", "sub-branch-admin"]), userController.role.remove);


        //DEPRECATED
        // =====================================================
        router.get('/users/:id/branches', allow(["branch-admin", "customer-admin"]), utils.deprecated);
        router.get('/users/:id/messages', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), utils.deprecated );
        router.get('/users/:id/groups', allow(["branch-admin", "customer-admin", "sub-branch-admin", "teacher"]), utils.deprecated);
        router.get('/users/:id/group-student', allow(["branch-admin", "customer-admin", "teacher"]), utils.deprecated);

        router.post('/users/:id/branches/update', allow(["customer-admin", "branch-admin"]), utils.deprecated);
        router.post('/users/:id/groups/add', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), utils.deprecated);
        router.post('/users/:id/groups/createAndAdd', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), utils.deprecated);
        router.post('/users/:id/groups/remove', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher"]), utils.deprecated);
        router.post('/users/notInGroup', allow(["customer-admin", "branch-admin", "teacher"]), utils.deprecated);
        router.post('/users/update', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), utils.deprecated);
        router.post('/users/avatar/update', allow(["customer-admin", "branch-admin", "teacher", "student", "parent"]), utils.deprecated);
        router.post('/users/:id/house/update', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student"]), utils.deprecated);
        router.post('/users/password/update', allow(["customer-admin", "branch-admin", "sub-branch-admin", "teacher", "student", "parent"]), utils.deprecated);
        router.post('/users/remove', allow(["customer-admin", "branch-admin"]), utils.deprecated);
        router.post('/users/:id/roles/remove', allow(["customer-admin", "branch-admin", "sub-branch-admin"]), utils.deprecated);
        router.post('/users/:id/quest/remove', allow(["customer-admin", "branch-admin"]), utils.deprecated);
        return router;
    }

    module.exports.appendPublicRoutes = function(router){
        router.get('/users/:id/parents',userController.parent.findParents);
        router.get('/users/exists/id/:id' , userController.find.exists);
        router.get('/users/exists/doc/:doc' , userController.find.exists);
        router.get('/users/exists/username/:username' , userController.find.exists);
        router.post('/students/create', userController.newStudent);
        router.post('/parents/create', userController.parent.new);
        return router;
    }

}).call(this);
