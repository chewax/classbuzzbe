(function(){

    module.exports = exports = function lastModifiedPlugin (schema, options) {
        schema.add({
            createdAt:  { type: Date },
            updatedAt:  { type: Date }
        });

        schema.pre('save', function(next){
            if (this.isNew) this.createdAt = Date.now();
            this.updatedAt = Date.now();
            next();
        });

        schema.pre('update', function(next) {
            //this actually adds the {$set:..} query to the update that is about to run
            this.update({}, { $set: { updatedAt: new Date() } });
            next();
        });


        schema.pre('findOneAndUpdate', function(next) {
            //this actually adds the {$set:..} query to the update that is about to run
            this.update({}, { $set: { updatedAt: new Date() } });
            next();
        });
    }

}).call(this);


