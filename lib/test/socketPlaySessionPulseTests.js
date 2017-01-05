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

/**
 * Connects Client.
 * @param user
 * @param session
 * @returns {*}
 */
function _clientConnect(user, session) {

    //When session is created, we connect our second and third client
    var client = io.connect( socketURL, options );
    client.on( 'connect', function ( data ) {

        client.emit( 'tieandjoin', user.id, user.customer );
        if (typeof session == 'object')
            client.emit( 'session.join', session._id, user.id );
        else
            client.emit( 'session.create', user.id, session);
    });

    return client;
}

describe("Socket IO Play Session Pulse Server",function(){

    it('Should broadcast to all clients when pulser is pressed and who did press it first', function(done){

        //var client1 = io.connect(socketURL, options);
        var client1;
        var client2;

        //It involves a countdown so...
        this.timeout(10000);

        client1 = _clientConnect(user1, 'play.pulse');

        client1.on( 'session.status.change', function ( _session, status ) {
            status.should.equal('ready');
            client1.emit( 'session.event', _session._id, user1.id, 'game.start' );
        });

        client1.on( 'session.game.start', function (_session) {
            client2.emit( 'session.event', _session._id, user2.id, 'pulse.pulse' );
            client1.emit( 'session.event', _session._id, user1.id, 'pulse.pulse' );
        });

        client1.on( 'session.pulse.pulse', function (_session, user) {
            user._id.should.equal(user2.id);
            _session.status.should.equal('pulsed');

            client1.disconnect();
            client2.disconnect();
            done();
        });

        client1.on( 'session.created', function ( _session ) {

            client2 = _clientConnect(user2, _session);
            client2.on( 'session.user.joined', function ( _session ) {
                //emit status ready event for both clients.
                client2.emit( 'session.event', _session._id, user2.id, 'user.ready' );
                client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );
            });

        });

    });


    it('Should rebound if answer is incorrect', function(done){

        var client3;
        var client2;
        var client1;

        var client2Joined = false;
        var client1Joined = false;

        //It involves a countdown so...
        this.timeout(20000);

        client3 = _clientConnect(user3, 'play.pulse');

        client3.on( 'session.status.change', function ( _session ) {
            if (_session.status == 'ready') {
                client3.emit( 'session.event', _session._id, user3.id, 'game.start' );
            }
        });

        client3.on( 'session.game.start', function (_session) {
            client2.emit( 'session.event', _session._id, user2.id, 'pulse.pulse' );
            client1.emit( 'session.event', _session._id, user1.id, 'pulse.pulse' );
            client3.emit( 'session.event', _session._id, user3.id, 'pulse.pulse' );
        });

        client3.on( 'session.pulse.pulse', function (_session, user) {

            user._id.should.equal(user2.id);
            _session.status.should.equal('pulsed');
            _session.questionPoints.should.equal(100);
            client3.emit( 'session.event', _session._id, user3.id, 'pulse.pulse.evaluate', {correct:false} );
        });


        client3.on( 'session.pulse.rebound', function (_session, user) {

            user._id.should.equal(user1.id);
            _session.questionPoints.should.equal(80);

            client1.disconnect();
            client2.disconnect();
            client3.disconnect();
            done();
        });


        client3.on( 'session.created', function ( _session ) {

            client1 = _clientConnect(user1, _session);
            client1.on( 'session.user.joined', function ( _session, user ) {
                if (user._id.toString() == user1.id.toString()) {
                    client1Joined = true;
                }

                if (client1Joined && client2Joined) {
                    client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );
                    client2.emit( 'session.event', _session._id, user2.id, 'user.ready' );
                    client3.emit( 'session.event', _session._id, user3.id, 'user.ready' );
                }
            });

            client2 = _clientConnect(user2, _session);
            client2.on( 'session.user.joined', function ( _session, user ) {

                if (user._id.toString() == user2.id.toString()) {
                    client2Joined = true;
                }

                if (client1Joined && client2Joined) {
                    client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );
                    client2.emit( 'session.event', _session._id, user2.id, 'user.ready' );
                    client3.emit( 'session.event', _session._id, user3.id, 'user.ready' );
                }
            });

        });

    });

});
