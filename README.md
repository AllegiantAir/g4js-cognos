# g4js-cognos [![Build Status](https://secure.travis-ci.org/AllegiantAir/g4js-cognos.png)](http://travis-ci.org/AllegiantAir/g4js-cognos) [![Code Climate](https://codeclimate.com/github/AllegiantAir/g4js-cognos/badges/gpa.svg)](https://codeclimate.com/github/AllegiantAir/g4js-cognos) [![Test Coverage](https://codeclimate.com/github/AllegiantAir/g4js-cognos/badges/coverage.svg)](https://codeclimate.com/github/AllegiantAir/g4js-cognos/coverage)
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

Pass in configuration settings, authenticate and get a report by parameters:

```js
var report = new Cms(serviceUrl, serviceNamespace, serviceUsername, servicePassword);

console.log('logging on...');

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

Pass in configuration settings, authenticate and export a report by parameters:

```js
var report = new Cms(serviceUrl, serviceNamespace, serviceUsername, servicePassword);
var fs = require('fs');

console.log('logging on...');

report.logon().then(function(response){

  console.log(response.statusCode, response.body);

  var qs = {
    p_prmFromDate: '2015-10-01',
    p_prmToDate: '2015-10-31',
    p_prmDetailOn: 'No'
  };

  console.log('getting export...');
  var file = '/tmp/export.xls';

  report.getExportById(reportId, qs, 'CSV').then(function(response){
    console.log('Status: ' + response.statusCode);

    fs.writeFile(file, response.body, 'utf8', function(err) {
      if (err) {
        return console.log(err);
      }

      console.log(file + ' was created!');
    });
  });
});
```

The example above exports a report in CSV format and then writes it to a file. A few output formats
`CSV, HTML, HTMLFragment, MHT, XML, spreadsheetML`, supported formats vary on version.

## Tests

```sh
$ npm test
```

## License

[MIT](LICENSE)

## Contribute

Pull Requests always welcome, as well as any feedback or issues. Made with <3 and [promises](http://documentup.com/kriskowal/q/).