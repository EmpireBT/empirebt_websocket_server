/*jslint node: true */
"use strict";
var request = require('request');
var mod_temp;
var base_url;
//battle_manager_exists is temp. Remove once web services are implemented

function fake_result(battle_id, data, cb) {
    cb(null, {
        ok : true,
        battle_id : battle_id,
        data : data
    });
}

function info(battle_id, cb) {
  request(base_url + 'battle/info.json?battle_id=' + battle_id,
          function (err, res, body) {
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      return cb(null, data);
    }
    return cb('Some error occurred', false);
  });
}

function result(battle_id, data, cb) {
  request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url:     base_url + 'battle/result.json',
    body:    "battle_id=" + battle_id + "&winner=" + data.winner +
             "&sp_conceded=" + data.sp_conceded + 
             "&sp_casualties_attacker=" + data.sp_casualties_attacker +
             "&sp_casualties_defender=" + data.sp_casualties_defender +
             "&end_type=" + data.end_type,
  }, function(error, response, body){
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      return cb(null, data);
    }
    return cb('Some error occurred', false);
  });
}

module.exports = mod_temp = function (settings) {
  base_url = settings.BASE_URL;
  return {
    info : function (battle_id, cb) {
      //TODO: implement call to web service for authentication
      info(battle_id, cb);
    },
    result : function (battle_id, data, cb) {
      result(battle_id, data, cb);
    }
  };
};