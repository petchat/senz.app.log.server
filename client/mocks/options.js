//var params = {
//
//    'external_user':'jiusi',
//    'dev_key':'wzf',
//    'user_trace':[
//        {
//            'timestamp':1427642632501,
//            'location':{
//                'latitude':39.987433,
//                '__type': 'GeoPoint',
//                'longitude':116.438513
//            }
//        }
//    ]
//};

var params = {
  "value": {},
  "type": "location",
  "source": "sdk",
  "locationRadius": 5,
  "timestamp": 1123333444,
  "location": {"lat":39.98057,"lng":116.4385},
  "userId": "559b7e6e2b5f91ab718914b4",
  "installationId": "559cd13c05986730cc6ce337"
}



module.exports = {

    // edit this section
    // for more options,
    // visit https://www.npmjs.org/package/request#request-options-callback-

    options: {
        //url: "http://182.92.4.173/mocky/get/"  // tyk all in one
        //url: "http://182.92.4.173:8080/mock/get/"  // tyk separated
        //url: 'http://httpbin.org/get'
        //url:"http://120.27.30.239:9222/senz/places/"
        url:"http://127.0.0.1:3000/api/Logs"
        //url:"http://123456aaaaaa.daoapp.io"
        //url:"https://leancloud.cn/1.1/functions/hello"
        ,timeout: 6000000
        ,headers:{
            "X-AVOSCloud-Application-Id":"1j1gg46dd36apem41pwvph8apu3133gy9hdsytukdjnkuo1n",
            "X-AVOSCloud-Application-Key":"z8ba32mlu5o4uqtrt4gq2fo9beh020zanz9s37urfs1b5u51",
            "X-AVOSCloud-Application-Production":1

        }
        ,json:params
    }

    //concurrent request number
    ,concurrent: 2
    ,logType: 'min'

}


