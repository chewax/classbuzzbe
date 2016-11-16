var should = require('should');
var io = require('socket.io-client');

var socketURL = 'http://0.0.0.0:5000';

var options ={
    transports: ['websocket'],
    'force new connection': true
};

var user1 = {'id': '57080fb0958deee52b157f11', 'customer': '5706b65bdf0560b027cd0a0f'}; //Anakin
var user2 = {'id': '570d5bd8958deee52b158570', 'customer': '5706b65bdf0560b027cd0a0f'}; //Padme
var user3 = {'id': '57080f41958deee52b157f00', 'customer': '5706b65bdf0560b027cd0a0f'}; //ObiWan


describe("Socket IO Basic Server",function(){

    it('Should advice to client that has joined the customer channel', function(done){
        var client1 = io.connect(socketURL, options);

        client1.on('connect', function(data){

            client1.emit('tieandjoin', user1.id, user1.customer);
            client1.on('joined.channel', function(channel){
                channel.should.equal(user1.customer);
                client1.disconnect();
                done();
            });

        });

    });

});
