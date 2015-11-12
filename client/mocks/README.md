# node-pressure-test

a simple nodejs pressure test app

## how to use

get it ready

```Batchfile
git clone https://github.com/zxdong262/node-pressure-test.git
cd node-pressure-test
cp options-sample.js options.js
sudo npm install
```

now just edit options.js

```javascript
module.exports = {

    // edit this section
    // for more options, 
    // visit https://www.npmjs.org/package/request#request-options-callback-

    options: {
        url: 'http://www.baidu.com'
        ,timeout: 600000
    }

    //concurrent request number
    ,concurrent: 150
    
}
```

run it

```Batchfile
node app
```

## license

mit