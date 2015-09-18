'use strict';

var assert = require('chai').assert;
var Cms = require('../lib/cms');
var sprintf = require('sprintf-js').sprintf;
var fixture = require('../coverage/cms.fixture.json');

describe('cms module', function(){

  var serviceUrl = fixture.serviceUrl;
  var namespace = fixture.namespace;
  var username = fixture.username;
  var password = fixture.password;

  var cms;

  before(function(){
    cms = new Cms(serviceUrl, namespace, username, password);
  });

  after(function(done){
    cms.logout().then(function(){
      done();
    });
  });

  describe('buildCredentialsXmlData()', function(){

    it('should be able to build xmlData for credentials', function(){
      var xmlData = '<credentials><credentialElements><name>CAMNamespace</name><value><actualValue>%s</actualValue></value></credentialElements><credentialElements><name>CAMUsername</name><value><actualValue>%s</actualValue></value></credentialElements><credentialElements><name>CAMPassword</name><value><actualValue>%s</actualValue></value></credentialElements></credentials>';
      xmlData = sprintf(xmlData, namespace, username, password);

      var credentials = cms.buildCredentialsXmlData(namespace, username, password);
      assert.equal(xmlData, credentials);
    });

  });

  describe('login()', function(){
    it('should be able to login', function(done){
      cms.login().then(function(response){
          assert.equal(200, response.statusCode);
          assert.isObject(response.bodyJson, 'response contains bodyJson');
          assert.isTrue(response.bodyJson.accountID instanceof String, 'accountID is valid');
      });
      done();
    });
  });

  describe('getReportById()', function(){
    this.timeout(15000);

    it('should be able to run a report', function(done){
      cms.login().then(function(){
        cms.getReportById(fixture.reportId, fixture.reportParams).then(function(response){
          assert.equal(200, response.statusCode);
          assert.isTrue(response.body instanceof String, 'HTML is valid');
          done();
        });

      });
    });

  });

});