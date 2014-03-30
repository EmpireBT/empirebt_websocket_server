/*jslint node: true */
"use strict";

//TODO: It is necessary to have a propagated setting for the base URL.
var request = require('request');
var mod_temp;
var base_url;

function general(token, user_id, cb) {
  request(base_url + 'authorization/general.json?token=' + 
          token + '&user_id=' + user_id, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      if (data.valid) {
        return cb(null, true);
      }
    }
    return cb('Some error occurred', false);
  });
}
function chat_empire(token, user_id, empire_id, cb, handshake_data) {
  request(base_url + 'authorization/chat_empire.json?token=' + 
          token + '&user_id=' + user_id + '&empire_id=' + empire_id, 
          function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      if (data.valid) {
        handshake_data.username = data.username;
        return cb(null, true);
      }
    }
    return cb('Some error occurred', false);
  });
}

function chat_oneonone(token, user_id, cb, handshake_data) {
  request(base_url + 'authorization/chat_oneonone.json?token=' + 
          token + '&user_id=' + user_id, function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      if (data.valid) {
        handshake_data.username = data.username;
        return cb(null, true);
      }
    }
    return cb('Some error occurred', false);
  });
}

function battle(token, user_id, battle_id, cb, handshake_data) {
  request(base_url + 'authorization/battle.json?token=' + 
          token + '&user_id=' + user_id + '&battle_id=' + battle_id, 
          function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      handshake_data.battle_manager_exists = data.battle_manager_exists;
      if (data.valid) {
        return cb(null, true);
      }
    }
    return cb('Some error occurred', false);
  });
}

module.exports = mod_temp = function(settings) {
  base_url = settings.base_url_webservice;
  return {
    general : function (handshake_data, cb) {
      var data = handshake_data.query;
      handshake_data.user_id = data.user_id;
      handshake_data.token = data.token;
      general(data.token, data.user_id, cb);
    },
    chat_empire : function (handshake_data, cb) {
      var data = handshake_data.query;
      handshake_data.user_id = data.user_id;
      handshake_data.token = data.token;
      handshake_data.empire_id = data.empire_id;

      chat_empire(data.token, data.user_id, data.empire_id, cb, handshake_data);
    },
    chat_oneonone : function (handshake_data, cb) {
      var data = handshake_data.query;
      handshake_data.user_id = data.user_id;
      handshake_data.token = data.token;
      chat_oneonone(data.token, data.user_id, cb, handshake_data);
      //model not designed for this now. Only validate identity
    },
    battle : function (handshake_data, cb) {
      var data = handshake_data.query;
      //TODO: implement call to web service for authentication
      //token, user_id, battle_id, cb
      handshake_data.user_id = data.user_id;
      handshake_data.token = data.token;
      handshake_data.battle_id = data.battle_id;
      battle(data.token, data.user_id, data.battle_id, cb, handshake_data);
    }
  };
};