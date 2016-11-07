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


describe("Socket IO Session Server",function(){

    it('Should CREATE a new session', function(done){

        var client1 = io.connect(socketURL, options);

        client1.on('connect', function(data){

            client1.emit('tieandjoin', user1.id, user1.customer);
            client1.emit('session.create', user1.id, 'play.pulse');

            client1.on('session.created', function(_session){
                (typeof _session).should.equal('object');

                _session._id.should.be.aboveOrEqual(5000);
                _session.type.should.be.equal('play.pulse');
                _session.connected.length.should.be.equal(1);
                _session.connected[0].user._id.should.be.equal(user1.id);

                client1.emit('session.leave', _session._id, user1.id);
                client1.disconnect();
                done();
            });
        });

    });


    it('Should DESTROY a session if room is empty', function(done){

        var client1 = io.connect(socketURL, options);

        client1.on('connect', function(data){

            var sessionObj = {};

            client1.emit('tieandjoin', user1.id, user1.customer);
            client1.emit('session.create', user1.id, 'play.pulse');

            client1.on('session.created', function(_session){
                sessionObj = _session;
                client1.emit('session.leave', _session._id, user1.id);
            });

            client1.on('session.destroyed', function(_session){
                (typeof _session).should.equal('object');
                _session._id.should.equal(sessionObj._id);
                client1.disconnect();
                done();
            });

        });

    });


    it('Should DESTROY a session if room owner leaves', function(done){

        var client1 = io.connect(socketURL, options);

        client1.on('connect', function(data){

            var sessionObj = {};

            client1.emit('tieandjoin', user1.id, user1.customer);
            client1.emit('session.create', user1.id, 'play.pulse');

            client1.on('session.created', function(_session) {
                sessionObj = _session;

                //When session is created, we connect our second client
                var client2 = io.connect( socketURL, options );
                client2.on( 'connect', function ( data ) {

                    client2.on( 'session.user.joined', function ( _session, _user ) {

                        if ( _user._id.toString() == user2.id.toString() ) {
                            client1.emit( 'session.leave', _session._id, user1.id );
                        }
                    });

                    client2.on( 'session.destroyed', function ( _session ) {
                        (typeof _session).should.equal( 'object' );
                        _session._id.should.equal( sessionObj._id );
                        _session.connected.length.should.equal( 1 );

                        client1.disconnect();
                        client2.disconnect();
                        done();
                    });

                    client2.emit( 'tieandjoin', user2.id, user2.customer );
                    client2.emit( 'session.join', _session._id, user2.id );

                });

            });
        });

    });


    it('Should JOIN a previously created session', function(done){

        var client1 = io.connect(socketURL, options);

        client1.on('connect', function(data){

            client1.emit('tieandjoin', user1.id, user1.customer);
            client1.emit('session.create', user1.id, 'play.pulse');


            client1.on('session.created', function(_session){

                //When session is created, we connect our second client
                var client2 = io.connect(socketURL, options);
                client2.on('connect', function(data){

                    client2.on('session.user.joined', function(_session, _user){

                        if (_user._id.toString() == user2.id.toString()) {

                            (typeof _session).should.equal('object');

                            _session.connected.length.should.be.equal(2);
                            _session.connected[0].user._id.should.be.equal(user1.id);
                            _session.connected[1].user._id.should.be.equal(user2.id);

                            client1.emit('session.leave', _session._id, user1.id);
                            client2.emit('session.leave', _session._id, user2.id);

                            client1.disconnect();
                            client2.disconnect();
                            done();

                        }
                    });

                    client2.emit('tieandjoin', user2.id, user2.customer);
                    client2.emit('session.join', _session._id, user2.id);


                });


            });
        });

    });


    it('Should NOT allow to JOIN a session twice', function(done){

        var client1 = io.connect(socketURL, options);

        client1.on('connect', function(data){

            client1.emit('tieandjoin', user1.id, user1.customer);
            client1.emit('session.create', user1.id, 'play.pulse');

            client1.on('session.created', function(_session){

                var secondJoin = false;

                //When session is created, we connect our second client
                var client2 = io.connect(socketURL, options);
                client2.on('connect', function(data){

                    client2.emit('tieandjoin', user2.id, user2.customer);
                    client2.emit('session.join', _session._id, user2.id);

                    client2.on('session.user.joined', function(_session, _user){

                        if (!secondJoin) {
                            client2.emit('session.join', _session._id, user2.id);
                            secondJoin = true;
                            return;
                        }

                    });

                    client2.on('session.error', function(_session, error){
                        error.code.should.equal(501);

                        client1.disconnect();
                        client2.disconnect();
                        done();
                    });


                });


            });
        });

    });


    it('Should NOT allow to JOIN a session in progress', function(done){

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
                client2.emit( 'session.join', _session._id, user2.id );
            });

            client1.on( 'session.created', function ( _session ) {

                client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );

                //When session is created, we connect our second client
                client2 = io.connect( socketURL, options );
                client2.on( 'connect', function ( data ) {
                    client2.emit( 'tieandjoin', user2.id, user2.customer );
                });

            });

            client1.on('session.error', function(_session, error){
                error.code.should.equal(502);
                _session.connected.length.should.equal(1);

                client1.disconnect();
                client2.disconnect();
                done();
            });
        });

    });


    it('Should LEAVE a previously joined session', function(done){

        var client1 = io.connect(socketURL, options);

        client1.on('connect', function(data){

            client1.emit('tieandjoin', user1.id, user1.customer);
            client1.emit('session.create', user1.id, 'play.pulse');

            client1.on('session.created', function(_session){

                //When session is created, we connect our second client
                var client2 = io.connect(socketURL, options);
                client2.on('connect', function(data){

                    client2.emit('tieandjoin', user2.id, user2.customer);
                    client2.emit('session.join', _session._id, user2.id);

                    client2.on('session.user.joined', function(_session, _user){
                        client2.emit('session.leave', _session._id, user2.id);
                    });

                    client2.on('session.user.left', function(_session, user){
                        _session.connected.length.should.be.equal(1);
                        _session.connected[0].user._id.should.be.equal(user1.id);

                        client1.disconnect();
                        client2.disconnect();
                        done();
                    });

                });

            });
        });

    });



    it('Should broadcast when a user changes its status', function(done){

        var client1 = io.connect(socketURL, options);

        client1.on('connect', function(data){

            client1.emit('tieandjoin', user1.id, user1.customer);
            client1.emit('session.create', user1.id, 'play.pulse');

            client1.on('session.user.status', function(user, status){

                user._id.should.equal(user2.id);
                status.should.equal('ready');

                client1.disconnect();
                done();
            });

            client1.on('session.created', function(_session){

                //When session is created, we connect our second client
                var client2 = io.connect(socketURL, options);
                client2.on('connect', function(data){

                    client2.emit('tieandjoin', user2.id, user2.customer);
                    client2.emit('session.join', _session._id, user2.id);

                    client2.on('session.user.joined', function(_session, _user){
                        //emit status ready event for both clients.
                        if (_user._id.toString() == user2.id.toString()) {
                            client2.emit('session.event', _session._id, user2.id, 'user.ready');
                            client2.disconnect();
                        }
                    });

                });

            });
        });

    });


});
