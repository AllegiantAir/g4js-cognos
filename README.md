# g4js-cognos
Node.js client for [Cognos](http://www-01.ibm.com/software/analytics/cognos/) application integration utilizing [CMS](http://www-03.ibm.com/software/products/en/cognos-mashup-service).

## Install

```sh
$ npm install g4js-cognos
```

## Usage

Require the module:

```js
var Cms = require('g4js-cognos').Cms;
```

Pass in configuration params, authenticate (logon) and get a report:

```js
var report = new Cms(serviceUrl, serviceNamespace, serviceUsername, servicePassword);

report.logon().then(function(response){

  console.log(response.statusCode, response.body);

  var qs = {
    p_prm1: 1,
    p_prm2: '2007-05-02',
    p_prm3: '2009-08-09',
    fmt: 'HTMLFragment'
  };

  console.log('getting report...');

  report.getReportById(reportId, qs).then(function(response){
    console.log(response.statusCode, response.body);
  });
  
});
```

## License

[MIT](LICENSE)

## Contribute

Pull Requests always welcome, as well as any feedback or issues. Made with <3 and [promises](http://documentup.com/kriskowal/q/).