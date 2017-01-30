var chai = require('chai');
var should = require('should');
var chaiHttp = require('chai-http');
require('../../../modules/core/shouldMixins')(should);

chai.use(chaiHttp);

var server = 'http://localhost:5000/api/v2';

var customer = {
    "_id" : "5706b65bdf0560b027cd0a0f",
    "name" : "Jedi Knight Academy",
    "email" : "jka@email.com",
    "phoneNumber" : "1234"
};

var branch = {
    "_id" : "5706b966df0560b027cd0a28",
    "name" : "Coruscant Academy",
    "email" : "jka@email.com",
    "phoneNumber" : "243",
    "customer" : "5706b65bdf0560b027cd0a0f",
    "registerCode" : "JKA"
}

var studentRole = {
    "_id" : "55f7275d502e2ada92fad7c8",
    "name" : "student",
    "mayGrant" : []
}

var parentRole = {
    "_id" : "55f7275d502e2ada92fad7c7",
    "name" : "parent",
    "mayGrant" : []
}

var adminToken = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpZCI6IjU3ZWQ1Y2U1NDg5NDQyZTlmMDZmNGY3MyIsImRvYyI6IjExMTEiLCJmaXJzdE5hbWUiOiJLYWthc2hpIiwibGFzdE5hbWUiOiJIYXRha2UiLCJlbWFpbCI6Imtha2FzaGlAZ21haWwuY29tIiwicm9sZXMiOlt7Il9pZCI6IjU1ZjcyNzVkNTAyZTJhZGE5MmZhZDdjZCIsIm5hbWUiOiJzdXBlci1hZG1pbiIsIm1heUdyYW50IjpbeyJfaWQiOiI1NWY3Mjc1ZDUwMmUyYWRhOTJmYWQ3Y2QiLCJuYW1lIjoic3VwZXItYWRtaW4ifSx7Il9pZCI6IjU1ZjcyNzVkNTAyZTJhZGE5MmZhZDdjYyIsIm5hbWUiOiJjdXN0b21lci1hZG1pbiJ9LHsiX2lkIjoiNTVmNzI3NWQ1MDJlMmFkYTkyZmFkN2NiIiwibmFtZSI6ImJyYW5jaC1hZG1pbiJ9LHsiX2lkIjoiNTVmNzI3NWQ1MDJlMmFkYTkyZmFkN2NhIiwibmFtZSI6InN1Yi1icmFuY2gtYWRtaW4ifSx7Il9pZCI6IjU1ZjcyNzVkNTAyZTJhZGE5MmZhZDdjOSIsIm5hbWUiOiJ0ZWFjaGVyIn0seyJfaWQiOiI1NWY3Mjc1ZDUwMmUyYWRhOTJmYWQ3YzgiLCJuYW1lIjoic3R1ZGVudCJ9LHsiX2lkIjoiNTVmNzI3NWQ1MDJlMmFkYTkyZmFkN2M3IiwibmFtZSI6InBhcmVudCJ9XX1dLCJicmFuY2giOm51bGwsImN1c3RvbWVyIjpudWxsLCJhdmF0YXJVUkwiOiJodHRwOi8vcHlyb21hbmNlci5jby5nZy5pbWFnZXMuczMuYW1hem9uYXdzLmNvbS91cGxvYWRzJTJGdE5Zd3cuanBnIiwiaG91c2UiOiI1NmJiODhhODUwMGI4YmRhMmFjNDA3OTIiLCJpYXQiOjE0ODU1NDgyOTR9.uXfNYYqdiQ9jgNSDLh-_Gu_e0qW5lwtXJnANu74ZkxU"

var authValue = "Bearer " + adminToken;

var studentData = {
    doc: 9889,
    firstName: 'Jim',
    lastName: 'Raynor',
    email: 'jim@email.com',
    gender: 'M',
    branch: branch._id,
    customer: branch.customer,
    credentials: {
        username: 'jim@email.com',
        password: 'changeme'
    },
    student: {
        parents: [{
            doc: '8778',
            firstName: 'Michael',
            lastName: 'Raynor',
            email: 'michael@email.com'
        },
        {
            doc: '7667',
            firstName: 'Linda',
            lastName: 'Raynor',
            email: 'linda@email.com'
        },]
    }
}


var parentData = {
    doc: 8778,
    firstName: 'Michael',
    lastName: 'Raynor',
    email: 'michael@email.com',
    gender: 'M',
    branch: branch._id,
    customer: branch.customer,
    credentials: {
        username: 'michael@email.com',
        password: 'changeme'
    }
}


var _res = {};
var _err = {};
var _parent = {};

describe("/POST student/create - parent/create", function(){

    before (function(done){
        this.timeout(5000);

        chai.request(server)
            .post('/public/students/create')
            .send(studentData)
            .end(function (err, res){
                _res = res;
                _err = err;

                done();
            });
    });

    it('Should return success', function(done){
        should.equal(_err, null);
        _res.status.should.equal(200);
        done();
    });

    it('Should create user with student role', function(done){
        
        //Get full profile of recently created user
        chai.request(server)
            .get('/users/' + _res.body._id)
            .set('Authorization', authValue)
            .end(function (err, res){
                res.body.roles.should.containEql(studentRole);
                done();
            });
        
    });

    it('Should add all skills to newly created student', function(done){
        //Get full profile of recently created user
        chai.request(server)
            .get('/users/' + _res.body._id)
            .set('Authorization', authValue)
            .end(function (err, res){
                res.body.student.character.skills.length.should.equal(6);
                done();
            });
    });

    it('Should add parent1 and parent2 information', function(done){
        //Get full profile of recently created user
        chai.request(server)
            .get('/users/' + _res.body._id)
            .set('Authorization', authValue)
            .end(function (err, res){
                res.body.student.parents.length.should.equal(2);
                res.body.student.parents[0].doc.should.equal(studentData.student.parents[0].doc)
                res.body.student.parents[1].doc.should.equal(studentData.student.parents[1].doc)
                done();
            });
    });

    it('Should create a a parent user and return success', function(done){
        this.timeout(5000);

        chai.request(server)
            .post('/public/parents/create')
            .send(parentData)
            .end(function (err, res){
                should.equal(err, null);
                res.status.should.equal(200);
                _parent = res.body;
                done();
            });
    });

    it('Should create parent with parent role', function(done){
        //Get full profile of recently created user
        chai.request(server)
            .get('/users/' + _parent._id)
            .set('Authorization', authValue)
            .end(function (err, res){
                res.body.roles.should.containEql(parentRole);
                done();
            });
        
    });

    it('Should delete recently created student', function(done){
        chai.request(server)
            .delete('/users')
            .set('Authorization', authValue)
            .send({id: _res.body._id})
            .end(function (err, res){
                res.status.should.equal(200);
                done();
            });
    });

    it('Should delete recently created parent', function(done){
        chai.request(server)
            .delete('/users')
            .set('Authorization', authValue)
            .send({id: _parent._id})
            .end(function (err, res){
                res.status.should.equal(200);
                done();
            });
    });

    
});




