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

describe("Socket IO Play Session Trivia Server",function(){

    it('Should not allow to select trivia if not session owner', function(done){
        
        var client1, client2, client3;
        

        //It involves a countdown so...
        this.timeout(10000);

        client3 = _clientConnect(user3, 'play.trivia');

        client3.on( 'session.created', function ( _session ) {

            client3.on( 'session.status.change', function ( _session ) {
                if (_session.status == 'ready') {
                    client3.emit( 'session.event', _session._id, user3.id, 'game.start' );
                }
            });

            //Connect first player
            client2 = _clientConnect(user2, _session);

            client2.on( 'session.joined.success', function ( _session ) {
                //Connect second player
                client1 = _clientConnect(user1, _session);

                client1.on( 'session.joined.success', function ( _session, _user ) {
                    client1.emit( 'session.event', _session._id, user1.id, 'game.trivia.select', {triviaId:'581c91c361a8346839744792'} );
                });
            });


            client2.on('session.error', function(_session, error){
                error.code.should.equal(300);

                client3.disconnect();
                client2.disconnect();
                done();
            });

        });

    });


    it('Should not allow to start if no trivia is selected', function(done){

        var client1, client2, client3;


        //It involves a countdown so...
        this.timeout(10000);

        client3 = _clientConnect(user3, 'play.trivia');

        client3.on( 'session.created', function ( _session ) {

            client3.on( 'session.status.change', function ( _session ) {
                if (_session.status == 'ready') {
                    client3.emit( 'session.event', _session._id, user3.id, 'game.start' );
                }
            });

            //Connect first player
            client2 = _clientConnect(user2, _session);

            client2.on( 'session.joined.success', function ( _session ) {
                //Connect second player
                client1 = _clientConnect(user1, _session);

                client1.on( 'session.joined.success', function ( _session, _user ) {
                    client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );
                    client2.emit( 'session.event', _session._id, user2.id, 'user.ready' );
                    client3.emit( 'session.event', _session._id, user3.id, 'user.ready' );
                });
            });


            client2.on('session.unable.start', function(_session, error){
                error.code.should.equal(400);

                client3.disconnect();
                client2.disconnect();
                done();
            });

        });

    });



    it('Should start trivia after countdown', function(done){

        var client1, client2, client3;

        //It involves a countdown so...
        this.timeout(10000);

        client3 = _clientConnect(user3, 'play.trivia');

        client3.on( 'session.created', function ( _session ) {

            client3.on( 'session.status.change', function ( _session ) {
                if (_session.status == 'ready') {
                    client3.emit( 'session.event', _session._id, user3.id, 'game.start' );
                }
            });

            //Connect first player
            client2 = _clientConnect(user2, _session);
            client2.on( 'session.joined.success', function ( _session ) {

                //Connect second player
                client1 = _clientConnect(user1, _session);

                client1.on( 'session.joined.success', function ( _session ) {
                    client3.emit( 'session.event', _session._id, user3.id, 'game.trivia.select', {triviaId:'581c91c361a8346839744792'} );
                });

                client1.on( 'session.trivia.selected', function ( _session ) {
                    client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );
                    client2.emit( 'session.event', _session._id, user2.id, 'user.ready' );
                    client3.emit( 'session.event', _session._id, user3.id, 'user.ready' );
                });


                client1.on('session.trivia.question', function(_session, question){

                    client1.disconnect();
                    client3.disconnect();
                    client2.disconnect();

                    done();
                })

            });

        });

    });


    it('Should process the trivia winner correctly', function(done){
        var client1, client2, client3;

        //It involves a countdown so...
        this.timeout(100000);

        client3 = _clientConnect(user3, 'play.trivia');

        client3.on( 'session.created', function ( _session ) {

            client3.on( 'session.status.change', function ( _session ) {
                if (_session.status == 'ready') {
                    client3.emit( 'session.event', _session._id, user3.id, 'game.start' );
                }
            });

            //Connect first player
            client2 = _clientConnect(user2, _session);
            client2.on( 'session.joined.success', function ( _session ) {

                //Connect second player
                client1 = _clientConnect(user1, _session);

                client1.on( 'session.joined.success', function ( _session ) {
                    client3.emit( 'session.event', _session._id, user3.id, 'game.trivia.select', {triviaId:'581c91c361a8346839744792'} );
                });

                client1.on( 'session.trivia.selected', function ( _session ) {
                    client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );
                    client2.emit( 'session.event', _session._id, user2.id, 'user.ready' );
                    client3.emit( 'session.event', _session._id, user3.id, 'user.ready' );
                });

                client1.on('session.trivia.question', function(_session, question){
                    client2.emit( 'session.event', _session._id, user2.id, 'game.trivia.answer', {answer: question.correctAnswer} );
                    client1.emit( 'session.event', _session._id, user1.id, 'game.trivia.answer', {answer: 3} );
                });

                client1.on('session.trivia.winner', function(_session, user){
                    user._id.should.equal(user2.id);

                    client1.disconnect();
                    client3.disconnect();
                    client2.disconnect();

                    done();
                })

            });

        });

    });


    it('Should not grant award if user score is zero', function(done){

        var client1, client2, client3;

        //It involves a countdown so...
        this.timeout(100000);

        client3 = _clientConnect(user3, 'play.trivia');

        client3.on( 'session.created', function ( _session ) {

            client3.on( 'session.status.change', function ( _session ) {
                if (_session.status == 'ready') {
                    client3.emit( 'session.event', _session._id, user3.id, 'game.start' );
                }
            });

            //Connect first player
            client2 = _clientConnect(user2, _session);
            client2.on( 'session.joined.success', function ( _session ) {

                //Connect second player
                client1 = _clientConnect(user1, _session);

                client1.on( 'session.joined.success', function ( _session ) {
                    client3.emit( 'session.event', _session._id, user3.id, 'game.trivia.select', {triviaId:'581c91c361a8346839744792'} );
                });

                client1.on( 'session.trivia.selected', function ( _session ) {
                    client1.emit( 'session.event', _session._id, user1.id, 'user.ready' );
                    client2.emit( 'session.event', _session._id, user2.id, 'user.ready' );
                    client3.emit( 'session.event', _session._id, user3.id, 'user.ready' );
                });


                client1.on('session.trivia.question', function(_session, question){
                    client1.emit( 'session.event', _session._id, user1.id, 'game.trivia.answer', {answer: -1} );
                });


                client1.on('session.trivia.winner', function(_session, user){
                    should.equal(user, null);

                    client1.disconnect();
                    client3.disconnect();
                    client2.disconnect();

                    done();
                })

            });

        });

    });

});

