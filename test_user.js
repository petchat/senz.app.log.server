/**
 * Created by zhanghengyang on 15/7/24.
 */

var request = require("request");

var obj = {"user_id":"558a5ee7e4b0acec6b941e96","begin":1435680000000,"end":1436889600000}

var params =
    //'where={"user":{"__type":"Pointer","className":"_User","objectId":"'+obj.user_id+ '"},'
    '?order=-createdAt' + "&keys=pois" + "&limit=999"
  ;



request.get({url: 'https://api.leancloud.cn/1.1/classes/UserLocation' + params,
  headers: {
    'X-AVOSCloud-Application-Id': 'pin72fr1iaxb7sus6newp250a4pl2n5i36032ubrck4bej81',
    'X-AVOSCloud-Application-Key': 'qs4o5iiywp86eznvok4tmhul360jczk7y67qj0ywbcq35iia',
    "Content-Type":"application/json"
  }}, function (error, response, body) {

  var points = JSON.parse(body).results;
  var trace = [];
  points.forEach(function(p){
    console.log("one result");
    console.log(p);
  })

  //console.log(points[0]);
  for(var index in points){
    //console.log(points[index].pois);
    var location = {
      //"locationId": points[index].objectId,
      //"type1": points[index].poiProbLv1,
      //"type2": points[index].poiProbLv2,
      "gps": {
        "lon": points[index].location.longitude,
        "lat": points[index].location.latitude
      },
      //"poi": points[index].pois.pois[0],
      "timestamp": points[index].timestamp
    };
    trace.push(location)
  }
  //trace = sortObj(trace,'timestamp','asc');
  return {'result':trace};
});
