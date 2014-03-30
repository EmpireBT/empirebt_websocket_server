/*jslint node: true */
"use strict";

var request = require('request');
var mod_temp;
var base_url;

function chat_oneonone_connected(user_id, presence, cb) {
  request(base_url + 'chat_oneonone/connected.json?user_id=' + user_id +
                      '&presence=' + presence, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      if (data.valid) {
        return cb(null, true);
      }
    }
    return cb('Some error occurred', false);
  });
}

function chat_empire_connected(user_id, presence, empire_id, cb) {
  request(base_url + 'chat_empire/connected.json?user_id=' + user_id +
                      '&presence=' + presence + '&empire_id=' + empire_id, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      if (data.valid) {
        return cb(null, true);
      }
    }
    return cb('Some error occurred', false);
  });
}

module.exports = mod_temp = function (settings) {
  base_url = settings.base_url_webservice;
  return {
    chat_oneonone_connected : function (user_id, presence, cb) {
      //TODO: implement call to web service for authentication
      chat_oneonone_connected(user_id, presence, cb);
    },
    chat_empire_connected : function (user_id, presence, empire_id, cb) {
      chat_empire_connected(user_id, presence, empire_id, cb);
    }
  };
};