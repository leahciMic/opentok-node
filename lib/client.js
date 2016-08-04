var nodeFetch = require('node-fetch');

require('es6-promise').polyfill();

var promiseTimeout = require('./promise-timeout.js');

var util = require('util'),
    _ = require('lodash'),
    to_json = require('xmljson').to_json,
    fetch = global.fetch || nodeFetch,
    pkg = require('../package.json'),
    defaultConfig = {
      apiKey: null,
      apiSecret: null,
      apiUrl: 'https://api.opentok.com',
      endpoints: {
        createSession: '/session/create'
      },
      request: {
        timeout: 30000 // 30 seconds
      }
    };

var Client = function(c) {
  this.c = {};
  this.config(_.defaults(c, defaultConfig));
};

Client.prototype.config = function(c) {
  _.merge(this.c, c);

  if ("request" in this.c) {
    console.warn('setting request config options is deprecated');
  }

  return this.c;
};

Client.prototype.createSession = function(opts, cb) {
  var timeout = this.c.timeout || (this.c.request && this.c.request.timeout);

  var form = Object.keys(opts).map(function(key) {
    return encodeURIComponent(key) + '=' + encodeURIComponent(opts[key]);
  }).join('&');

  var fetchOptions = {
    method: 'POST',
    body: form,
    headers: {
      // 'accept': 'application/json',
      'User-Agent': 'OpenTok-Node-SDK/' + pkg.version,
      'X-TB-PARTNER-AUTH': this.c.apiKey + ':' + this.c.apiSecret,
      'content-type': 'application/x-www-form-urlencoded'
    }
  };

  // node-fetch supports timeouts
  if (timeout) {
    fetchOptions.timeout = timeout;
  }

  var fetcher = fetch(this.c.apiUrl + this.c.endpoints.createSession, fetchOptions);

  // no official timeout method in the fetch API yet (2016/01/07)
  if (timeout) {
    fetcher = promiseTimeout(timeout, fetcher);
  }

  fetcher
    .then(function(resp) {
      if (resp.status === 403 || resp.statusCode >= 500 && resp.statusCode <= 599) {
        return resp.text().then(function(body) {
          // handle client errors
          if (resp.status === 403) {
            throw new Error('An authentication error occurred: (403) ' + body);
          }

          // handle server errors
          throw new Error('An authentication error occurred: (' + resp.status + ') ' + body);
        });
      }

      return resp.text();
    })
    .then(function(text) {
      return new Promise(function(resolve, reject) {
        to_json(text, function(err, json) {
          if (err) return reject(new Error('Could not parse XML: ' + err));
          resolve(json);
        });
      });
    })
    .then(function(json) {
      cb(null, json);
    })
    .catch(function(error) {
      if (!error) {
        error = new Error('Something went wrong');
      }
      cb(error);
    });
};

Client.prototype.startArchive = function() {
};

Client.prototype.stopArchive = function() {
};

Client.prototype.getArchive = function() {
};

Client.prototype.listArchives = function() {
};

Client.prototype.deleteArchive = function() {
};

module.exports = Client;
