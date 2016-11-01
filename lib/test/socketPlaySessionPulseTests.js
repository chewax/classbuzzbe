var should = require('should');
var io = require('socket.io-client');
var _ = require('lodash');

var socketURL = 'http://0.0.0.0:5000';

var options ={
    transports: ['websocket'],
    'force new connection': true
};

var user1 = {'id': '57080fb0958deee52b157f11', 'customer': '5706b65bdf0560b027cd0a0f'}; //Anakin
var user2 = {'id': '570d5bd8958deee52b158570', 'customer': '5706b65bdf0560b027cd0a0f'}; //Padme
var user3 = {'id': '57080f41958deee52b157f00', 'customer': '5706b65bdf0560b027cd0a0f'}; //ObiWan


describe("Socket IO Play Session Pulse Server",function(){

    it('Should broadcast to all clients when pulser is pressed and who did press it first', function(done){

        var client1 = io.connect(socketURL, options);
        var client2;

        //It involves a countdown so...
        this.timeout(10000);

        client1.on('connect', function(data) {

            client1.emit( 'tieandjoin', user1.id, user1.customer );
            client1.emit( 'session.create', user1.id, 'play.pulse' );

            client1.on( 'session.status.change', function ( _session, status ) {
                status.should.equal('ready');
                client1.emit( 'session.event', _session._id, user1.id, 'game.start' );
            });

            client1.on( 'session.game.start', function (_session) {
                client2.emit( 'session.event', _session._id, user2.id, 'game.pulse' );
                client1.emit( 'session.event', _session._id, user1.id, 'game.pulse' );
            });

            client1.on( 'session.game.pulse', function (_session, user) {
                user._id.should.equal(user2.id);
                _session.status.should.equal('waiting');

                client1.disconnect();
                client2.disconnect();
                done();
            });

            client1.on( 'session.created', function ( _session ) {

                //When session is created, we connect our second client
                client2 = io.connect( socketURL, options );
                client2.on( 'connect', function ( data ) {

                    client2.emit( 'tieandjoin', user2.id, user2.customer );
                    client2.emit( 'session.join', _session._id, user2.id );

                    client2.on( 'session.user.joined', function ( _session ) {
                        //emit status ready event for both clients.
                        client2.emit( 'session.event', _session._id, user2.id, 'user.ready' );
                        client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );
                    });

                });

            });
        });

    });

});
