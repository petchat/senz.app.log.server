
/*
 * node pressure test
 */

var
q = require('q')
,request = require('request').post
,opts = require('./options')
,concurrent = opts.concurrent
,logType = opts.logType



//start
setInterval(function(){
  start();
}, 2000)
//start()








function start() {

	console.log('--- start node pressure test @' + new Date())
	console.log('--- ' + 'concurrent:' + concurrent)
	console.log('');

	var jobCount = 0
	,i = 0;

	for(;i < concurrent;i ++) {
		qr(opts.options)
		.done(function(data) {

			var response =  data.response
			,t1 = data.t1
			,t2 = data.t2
			,t = t2 - t1

			console.log(
				response.statusCode +
				' ' +
				t + ' ms '
			);
        console.log(
          JSON.stringify(data.body));

			jobCount ++
			if(jobCount === concurrent) {
				console.log(' ')
				console.log('--- test end')
			}
		}, function(data) {
			var
			t1 = data.t1
			,t2 = data.t2
			,t = t2 - t1
			console.log(
				'error' +
				' ' +
				t + ' ms ' +
				data.error
			)
			jobCount ++
			if(jobCount === concurrent) {
				console.log(' ')
				console.log('--- test end')
			}
		})
	}
	//end
}



function qr(args) {
	return (function(args) {
		var def = q.defer()
		,t1 = new Date().getTime()
		,t2 = 0

		request(args, function(error, response, body) {
			t2 = new Date().getTime()
			if(error) def.reject({
				error: error
				,t1: t1
				,t2: t2
			})
			else def.resolve({
				body: body
				,response: response
				,t1: t1
				,t2: t2
			})
		})

		return def.promise
	})(args)
}
