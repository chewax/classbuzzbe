(function(){

    var _ = require('lodash');

    module.exports = exports = function tagsPlugin (schema, options) {

        options = _.merge({
            optionKey: 'tag',
            hashtagsOnly: false,
            path: 'tags',
            match: new RegExp('#[a-z_\\-0-9]+','gi'),
        }, options || {});

        schema.path(options.path, {type: [{type:String}]});

        var pathsToTag = [];

        /**
         * Selects all paths that must be converted into tags.
         */
        schema.eachPath(function (pathname, schemaType) {
            if (schemaType.options && schemaType.options[options.optionKey]) {
                var option = schemaType.options[options.optionKey];
                pathsToTag.push({ path: pathname, tag: option });
            }
        });

        /**
         * Adds pre save middleware.
         * Calculates tags from all flagged paths.
         */
        schema.pre('save', function(next){
            var self = this;
            pathsToTag.forEach(function(path){
                self[options.path] = _.union(self[options.path], toTags(self[path.path]))
            });

            next();
        });

        function removeHash(tag){
            return tag.substr(1);
        }

        /**
         * Strips tags from a string. By default it splits on spaces.
         * If hashtagsOnly flag is on, then it only selects #tags.
         *
         * @param text
         * @returns {Array}
         */
        function toTags(text) {
            text = text.toLowerCase();

            //If hashtagsOnly option is selected, return only hashtagged words
            if (options.hashtagsOnly) {
                var tags = text.match( options.match );
                if (tags != null) return tags.map(removeHash);
                else return [];
            }

            //By default return all words split by space.
            return text.split(" ");
        }

        /**
         * Add tags to current object.
         * @param [string] tags - new tags to add to object.
         * @param bool [save] - optional defaults to true.
         * @returns {Promise}
         */
        schema.methods.addTags = function(tags, save) {

            if ( _.isNil(save)) save = true;
            var self = this;

            return new Promise(function(resolve, reject){
                self[options.path] = _.union(tags, self.tags);

                if (save) {
                    self.save()
                        .then(function(result){ resolve(result) })
                        .catch(function(err){ reject(err) })
                }
                else {
                    resolve(self);
                }
            });
        };

        /**
         * Remove tags from current object
         * @param [string] tags - new tags to add to object.
         * @param bool [save] - optional defaults to true.
         * @returns {Promise}
         */
        schema.methods.removeTags = function(tags, save) {

            if ( _.isNil(save)) save = true;
            var self = this;

            return new Promise(function(resolve, reject){
                self[options.path] = _.difference(self.tags, tags);

                if (save) {
                    self.save()
                        .then(function(result){ resolve(result) })
                        .catch(function(err){ reject(err) })
                }
                else {
                    resolve(self);
                }
            });
        };

        /**
         * Returns true if object has 1 or more of sent tags.
         * @param tags
         * @returns {boolean}
         */
        schema.methods.hasTag = function(tags) {
            var commonTags = _.intersection(tags, this.tags);
            return (commonTags.length > 0)
        }


    }

}).call(this);

