module.exports = function(Model, options) {
    Model.defineProperty('createdAt', {type: Date, default: '$now'});
    Model.defineProperty('updatedAt', {type: Date, default: '$now'});
};
