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

var house = {
    "_id" : "5706b72adf0560b027cd0a10",
    "name" : "Sith Empire"
};

var createdHouseId = "";

describe("/GET Houses", function(){
    it('Should get all houses', function(done){
        chai.request(server)
            .get('/houses')
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.length.should.be.eql(4);
                done();
            });
    });

    it('Should get all customer houses', function(done){
        chai.request(server)
            .get('/houses/customer/' + customer._id)
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.length.should.be.eql(4);
                done();
            });
    });

    it('Should get a specific house', function(done){
        chai.request(server)
            .get('/houses/' + house._id)
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.name.should.equal(house.name);
                done();
            });
    })

    it('Should get a specific house events', function(done){
        chai.request(server)
            .get('/houses/' + house._id +'/events')
            .end(function (err, res){
                res.status.should.equal(200);
                res.body[0].branch.should.be.populated('_id name');
                done();
            });
    });

    it('Should create a new house', function(done){
        chai.request(server)
            .post('/houses')
            .send({
                name: 'Test House',
                logo: 'somelogo.url',
                score:0,
                head:null,
                customer:customer._id
            })
            .end(function (err, res){
                createdHouseId = res.body._id;
                res.status.should.equal(200);
                res.body.should.have.property('_id').which.is.a.String();
                res.body.should.have.property('name').which.is.a.String();
                res.body.should.have.property('logo').which.is.a.String();
                res.body.should.have.property('customer').which.is.a.String();
                res.body.should.have.property('score').which.is.a.Number();
                done();
            });
    });

    it('Should update recently created house', function(done){
        chai.request(server)
            .put('/houses')
            .send({"_id": createdHouseId, "name": "Updated HouseName"})
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.name.should.equal("Updated HouseName");
                done();
            });
    });


    it('Should find a house users', function(done){
        chai.request(server)
            .post('/houses/'+createdHouseId+'/users')
            .send({
                searchField: '',
                searchFilters: {customer: customer._id},
                page: 1,
                limit: 2
            })
            .end(function (err, res){
                res.status.should.equal(200);
                res.body[0].length.should.equal(0);
                res.body[1].should.equal(1);
                res.body[2].should.equal(0);
                done();
            });
    });

    it('Should delete recently created house', function(done){
        chai.request(server)
            .delete('/houses')
            .send({"_id": createdHouseId})
            .end(function (err, res){
                res.status.should.equal(200);
                done();
            });
    });

    it('Should find and paginate houses', function(done){
        chai.request(server)
            .post('/houses/find/paginate')
            .send({
                searchField: '',
                searchFilters: {customer: customer._id},
                page: 1,
                limit: 2
            })
            .end(function (err, res){
                res.status.should.equal(200);
                res.body[0].length.should.equal(2);
                res.body[1].should.equal(2);
                res.body[2].should.equal(4);
                done();
            });
    });


    it('Should get house members count', function(done){
        chai.request(server)
            .get('/houses/customer/'+customer._id+'/members/count')
            .end(function (err, res){
                res.status.should.equal(200);
                res.body.should.be.a.Array();
                res.body.length.should.equal(4);
                res.body[0].should.have.property('house').which.is.a.Object();
                res.body[0].should.have.property('members').which.is.a.Number();
                done();
            });
    });
});



