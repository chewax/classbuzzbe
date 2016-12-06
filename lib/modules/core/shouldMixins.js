(function(){

    module.exports = function(should) {

        //fields: space separated fields that where selected upon population
        should.Assertion.add('populated', function(fields) {
            this.params = { operator: 'to be populated' };

            (typeof this.obj).should.equal('object');
            var fieldArray = fields.split(' ');
            var self = this;
            fieldArray.forEach(function(f) {
                self.obj.should.have.property(f);
            })

        });

    }

}).call(this);
