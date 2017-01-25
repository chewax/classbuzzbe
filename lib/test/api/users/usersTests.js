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


var data = {
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


var _res = {};
var _err = {};

describe("/POST students/create", function(){

    before (function(done){
        this.timeout(5000);

        chai.request(server)
            .post('/public/students/create')
            .send(data)
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
            .end(function (err, res){
                res.body.roles.should.containEql(studentRole);
                done();
            });
        
    });

    it('Should add all skills to newly created student', function(done){
        //Get full profile of recently created user
        chai.request(server)
            .get('/users/' + _res.body._id)
            .end(function (err, res){
                res.body.student.character.skills.length.should.equal(6);
                done();
            });
    });

    it('Should add parent1 and parent2 information', function(done){
        //Get full profile of recently created user
        chai.request(server)
            .get('/users/' + _res.body._id)
            .end(function (err, res){
                res.body.student.parents.length.should.equal(2);
                res.body.student.parents[0].doc.should.equal(data.student.parents[0].doc)
                res.body.student.parents[1].doc.should.equal(data.student.parents[1].doc)
                done();
            });
    });

    it('Should delete recently created student', function(done){
        chai.request(server)
            .delete('/users')
            .send({id: _res.body._id})
            .end(function (err, res){
                res.status.should.equal(200);
                done();
            });
    });

    
});



