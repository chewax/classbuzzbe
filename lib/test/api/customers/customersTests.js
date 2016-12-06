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

var createdCustomerId = "";

describe("/GET Customers", function(){
    it('Should get all customers', function(done){
        chai.request(server)
            .get('/customers')
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.length.should.be.eql(1);
                done();
            });
    });

    it('Should get all customer houses', function(done){
        chai.request(server)
            .get('/customers/' + customer._id + '/houses')
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.length.should.be.eql(4);
                done();
            });
    });

    it('Should get all customer branches', function(done){
        chai.request(server)
            .get('/customers/' + customer._id + '/branches')
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.length.should.be.eql(1);
                done();
            });
    });

    it('Should get all customer admins', function(done){
        chai.request(server)
            .get('/customers/' + customer._id + '/admins')
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.length.should.be.eql(1);
                done();
            });
    });

    it('Should get a specific customer', function(done){
        chai.request(server)
            .get('/customers/' + customer._id)
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.should.have.property('_id').which.is.a.String();
                res.body.should.have.property('name').which.is.a.String();
                res.body.should.have.property('email').which.is.a.String();
                res.body.should.have.property('phoneNumber').which.is.a.String();
                res.body.should.have.property('logoURL').which.is.a.String();
                res.body.should.have.property('settings').which.is.a.Object();
                res.body.should.have.property('address').which.is.a.Object();
                res.body.should.have.property('agreements').which.is.a.Object();
                done();
            });
    });

    it('Should create a new customer', function(done){
        chai.request(server)
            .post('/customers')
            .send({
                name: 'Test Customer',
                logoURL: 'somelogo.url',
                phoneNumber: '5558000',
                settings: [],

                address: {
                    street: "sesame street",
                    number: "666",
                    city:   "sesame city",
                    state:  "sesame state",
                    zip:    "sesame zip",
                    country: "sesame country"
                },

                agreements: []
            })
            .end(function (err, res){
                createdCustomerId = res.body._id;
                res.status.should.equal(200);
                res.body.should.have.property('_id').which.is.a.String();
                res.body.should.have.property('name').which.is.a.String();
                res.body.should.have.property('logoURL').which.is.a.String();
                res.body.should.have.property('phoneNumber').which.is.a.String();
                res.body.should.have.property('address').which.is.a.Object();
                res.body.should.have.property('settings').which.is.a.Array();
                res.body.should.have.property('agreements').which.is.a.Array();
                done();
            });
    });

    it('Should update recently created customer', function(done){
        chai.request(server)
            .put('/customers')
            .send({"_id": createdCustomerId, "name": "Updated CustomerName"})
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.name.should.equal("Updated CustomerName");
                done();
            });
    });

    it('Should delete recently created customer', function(done){
        chai.request(server)
            .delete('/customers')
            .send({"_id": createdCustomerId})
            .end(function (err, res){
                res.status.should.equal(200);
                done();
            });
    });
});



