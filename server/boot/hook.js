module.exports = function(server) {
    var remotes = server.remotes();
    remotes.after('**', function (ctx, next) {
        console.log(ctx);
        ctx.result = {id: ctx.result.id,
            createdAt: ctx.result.createdAt,
            userId: ctx.result.userId};
        next();
    });
};
