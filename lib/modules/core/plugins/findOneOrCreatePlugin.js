(function(){

    module.exports = exports = function localesPlugin (schema, options) {

        schema.statics.findOneOrCreate = function (query, doc) {

            var self = this;

            return new Promise(function(resolve, reject){
                self.findOne(query)
                    .then(function(result){
                        if (result) {
                            resolve({
                                document: result,
                                isNew: false
                            });
                        } else {
                            self.create(doc, function(err, result) {
                                if (err) reject(err)
                                else resolve({
                                    document: result,
                                    isNew: true
                                });;
                            });
                        }
                    })
                    .catch(function(err){
                        reject(err);
                    })
            })
        };
    }

}).call(this);


