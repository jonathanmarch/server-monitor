var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var simple = require('simple-mock');

var Monitor = require('../../server/monitor.js');

var should = chai.should();
chai.use(chaiAsPromised);

describe('Monitor', function() {

  describe('#tick', function() {

    it('tick should be called', function(done) {

      Monitor.servers = {};
      Monitor.delay = 0;

      var tick = simple.mock(Monitor, 'tick').returnWith(null);

      Monitor.start();

      setTimeout(function() {

        tick.callCount.should.be.equal(1);

        done();
      }, 10);

    });
  });

  describe('#checkPing', function() {

    it('should resolve with ping in ms', function(done) {
      Monitor.checkPing('google.com').should.be.fulfilled.and.notify(done);
    });

    it('should should reject with Error object on invalid host', function(done) {
      Monitor.checkPing('notarealdomain1111.com').should.be.rejectedWith(Error).notify(done);
    });

  });

  describe('#checkHTTP', function(done) {

    it('should resolve with http response time', function(done) {
      Monitor.checkHTTP('http://google.com').should.be.fulfilled.and.eventually.be.above(0).notify(done);
    });

    it('should reject with http status error code 404', function(done) {
      Monitor.checkHTTP('http://google.com/test').should.be.rejected.and.eventually.equal(404).notify(done);
    });

    it('should reject with Error object of invalid url', function(done) {
      Monitor.checkHTTP('invaliddomain.com').should.be.rejectedWith(Error).notify(done);
    });

  });

  describe('#checkGameServer', function() {

    it('should resolve with game server details', function() {

      var promise = Monitor.checkGameServer('cod4', '66.150.121.164', 28931);

      return Promise.all([
        promise.should.be.fufilled,
        promise.should.eventually.to.be.a('object'),
        promise.should.eventually.have.property('name'),
        promise.should.eventually.have.property('players'),
        promise.should.eventually.have.property('maxplayers'),
        promise.should.eventually.have.property('players').with.length.to.be.at.least(1),
      ]);

    });

    it('should reject with invalid non responsive host', function(done) {

      this.timeout(15000);

      Monitor.checkGameServer('cod4', '178.222.111', 2222).should.be.rejectedWith(Error).notify(done);

    });

  });

  describe('#getGamesList', function() {

    it('should retreive an array of usable games', function() {

      var games = Monitor.getGamesList();

      games.should.be.an('array');
      games.length.should.be.above(0);

      games[0].should.to.have.property('name');
      games[0].should.to.have.property('type');

    });

  });

});
