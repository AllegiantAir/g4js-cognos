'use strict';

// TODO prompt helpers (dynamic forms)
// TODO better response parsing routines

var _ = require('lodash');
var xml2js = require('xml2js');
var request = require('request');
var Q = require('q');
var credentialsJson = require('./credentials.json');

// Wrapper module to facilities the communication to Cognos Mashup
// Service ([CMS](http://www.ibm.com/developerworks/data/library/techarticle/dm-1001cognosmashup/index.html)).
// Utilize promises from all reqeusts to CMS.

// Helper function to find credentialElement by name.
function getCAMNode(credentialElements, name) {
  return _.findWhere(credentialElements, { name: name });
}

// Helper function to format auth ns tag name.
function formatAuthTagName(name) {
  return name.replace('auth:', '');
}

// Cms
// --------------

function Cms(serviceUrl, namespace, username, password) {

  this.serviceUrl = serviceUrl;
  this.namespace = namespace;
  this.username = username;
  this.password = password;

}

// Build XML string for used in login request.
Cms.prototype.buildCredentialsXmlData = function(namespace, username, password) {
  // TODO check for params

  // clean up/format xml for cognos
  var builderOptions = {headless:true, renderOpts: {pretty:false}};
  var builder = new xml2js.Builder(builderOptions);

  // json to xml ftw!
  var data = credentialsJson;
  var credentialElements = data.credentials.credentialElements;

  // inject params
  var ns = getCAMNode(credentialElements, 'CAMNamespace');
  ns.value.actualValue = namespace;
  var u = getCAMNode(credentialElements, 'CAMUsername');
  u.value.actualValue = username;
  var p = getCAMNode(credentialElements, 'CAMPassword');
  p.value.actualValue = password;

  // return xml string
  return builder.buildObject(data);
};

// Create options object for all requests to CMS.
Cms.prototype.options = function(qs) {
  var ops = {
    baseUrl: this.serviceUrl,
    qs: qs,
    jar: true, // enable cookies for requests
    gzip: true
  };

  if (qs) {
    ops.qs = qs;
  }

  return ops;
};

// Create URL string for all requests to CMS.
Cms.prototype.url = function(resourceType, sourceType, sourceId) {
  var parts = ['', 'rds', resourceType, sourceType];
  // append sourceId when needed
  if (sourceId) {
    parts.push(sourceId);
  }
  return parts.join('/');
};

// Create login session, subsequent calls will utilize the same authenticated session.
// CMS REST services utilize session management via cookies that are set during the login process.
// We are leveraging the cookie jar container with the request module to simulate this behavior.
Cms.prototype.logon = function() {

  var xmlData = this.buildCredentialsXmlData(this.namespace, this.username, this.password);
  var ops = this.options({ xmlData: xmlData });
  var url = this.url('auth', 'logon');
  var self = this;

  var d = Q.defer();

  request.get(url, ops, function(error, response) {
    if (error) {
      d.reject(error);
      return;
    }

    // transform response to json
    var parser = new xml2js.Parser({
      tagNameProcessors: [formatAuthTagName]
    });
    parser.parseString(response.body, function(error, result) {
      if (error) {
        d.reject(error);
        return;
      }

      var accountInfo = result.accountInfo || {};
      response.bodyJson = self.auth = {};
      response.bodyJson.accountID = _.first(accountInfo.accountID || null);
      response.bodyJson.displayName = _.first(accountInfo.displayName || null);
      d.resolve(response);
    });

  });

  return d.promise;
};

// Expire current session.
Cms.prototype.logoff = function() {

  var ops = this.options();
  var url = this.url('auth', 'logoff');

  // <3 promises
  var d = Q.defer();

  request.get(url, ops, function(error, response) {
    if (error) {
      d.reject(error);
      return;
    }
    d.resolve(response);
  });

  return d.promise;
};

// Get a report by source_id and parameters. Helper method for
// `/rds/reportData/report/{sourceId}` and query params.
Cms.prototype.getReportById = function(sourceId, qs) {

  var ops = this.options(qs);
  var url = this.url('reportData', 'report', sourceId);

  // <3 promises
  var d = Q.defer();

  request.get(url, ops, function(error, response) {
    if (error) {
      d.reject(error);
      return;
    }

    d.resolve(response);
  });

  return d.promise;
};

// Helper function to parse item nodes in JSON response.
Cms.prototype.getLine = function(row) {
  var line = [];
  _.each(row, function(col){
    line.push(col.item[0].txt.val); // val, valType, fmtVal, fmtPatrn
  });
  return line;
};

// Helper function to parse JSON data into an array of row arrays.
Cms.prototype.parseLstJson = function(data) {
  var out = [];

  if (!data.document || !data.document.pages) {
    return out;
  }

  _.each(data.document.pages, function(p){
    _.each(p.page.body.item, function(item){
      // add list info/header
      out.push(this.getLine(item.lst.colTitle));
      _.each(item.lst.group.row, function(row){
        // add list row
        out.push(this.getLine(row.cell));
      }, this);
    }, this);
  }, this);

  return out;
};

// Exports

module.exports = Cms;
