'use strict';

var _ = require('lodash');
var xml2js = require('xml2js');
var request = require('request');
var Q = require('q');
var credentialsJson = require('./credentials.json');

// Facilities the communication to Cognos Mashup Service ([CMS](http://www.ibm.com/developerworks/data/library/techarticle/dm-1001cognosmashup/index.html)).

// Cms
// --------------

// Helper function to find credentialElement by name.
function getCAMNode(credentialElements, name) {
  return _.findWhere(credentialElements, { name: name });
}

// Helper function to format auth ns tag name.
function formatAuthTagName(name) {
  return name.replace('auth:', '');
}


function Cms(serviceUrl, namespace, username, password) {

  this.serviceUrl = serviceUrl;
  this.namespace = namespace;
  this.username = username;
  this.password = password;
  this.auth = null;

}

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

Cms.prototype.options = function(qs) {
  var ops = {
    baseUrl: this.serviceUrl,
    qs: qs,
    jar: true,
    gzip: true
  };

  if (qs) {
    ops.qs = qs;
  }

  return ops;
};

Cms.prototype.url = function(resourceType, sourceType, sourceId) {
  var parts = ['', 'rds', resourceType, sourceType];
  if (sourceId) {
    parts.push(sourceId);
  }
  return parts.join('/');
};


Cms.prototype.login = function() {

  var xmlData = this.buildCredentialsXmlData(this.namespace, this.username, this.password);
  var ops = this.options({ xmlData: xmlData });
  var url = this.url('auth', 'logon');
  var self = this;

  // <3 promises
  var d = Q.defer();

  request.get(url, ops, function(error, response, body) {
    if (error) {
      d.reject(error);
      return;
    }

    // transform response to json
    var parser = new xml2js.Parser({
      tagNameProcessors: [formatAuthTagName]
    });
    parser.parseString(response.body, function(err, result) {
      var accountInfo = result.accountInfo || {};
      response.bodyJson = self.auth = {};
      response.bodyJson.accountID = _.first(accountInfo.accountID || null);
      response.bodyJson.displayName = _.first(accountInfo.displayName || null);
      d.resolve(response);
    });

  });

  return d.promise;
};

Cms.prototype.logout = function() {

  var ops = this.options();
  var url = this.url('auth', 'logout');

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

module.exports = Cms;
