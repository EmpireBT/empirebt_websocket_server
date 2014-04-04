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
      var tiles = [];
      for (var i = 0; i < 24; i++) {
        for (var j = 0; j < 20; j++) {
          var st = [226,225,227,228,229,202,203,204,179,250,251,252,275];
          var is_hill = false;
          for (var s = 0; s < st.length; s++) {
            if (st[s] == j*24+i) {
              is_hill = true;
              break;
            }
          }
          tiles.push({obstacle : false, position:{x:i,y:j},is_hill:is_hill});
        }
      }
      return cb(null, { 
        "attacker" : "1", 
        "defender" : "2", 
        "sp_attacker" : 200, 
        "sp_defender": 150, 
        "conf_attacker" : { 
          units : [ 
            {type:"Archer", position:{x:0,y:0}, direction:'down'},
            {type:"Soldier", position:{x:1,y:0}, direction:'down'},
            {type:"Hoplite", position:{x:2,y:0}, direction:'down'},
            {type:"Archer", position:{x:3,y:0}, direction:'down'},
            {type:"Archer", position:{x:4,y:0}, direction:'down'},
            {type:"Archer", position:{x:5,y:0}, direction:'down'},
            {type:"Archer", position:{x:6,y:0}, direction:'down'},
            {type:"Archer", position:{x:7,y:0}, direction:'down'},
            {type:"Archer", position:{x:8,y:0}, direction:'down'},
            {type:"Soldier", position:{x:1,y:1}, direction:'down'},
            {type:"Soldier", position:{x:2,y:1}, direction:'down'},
            {type:"Soldier", position:{x:3,y:1}, direction:'down'},
            {type:"Soldier", position:{x:4,y:1}, direction:'down'},
            {type:"Soldier", position:{x:5,y:1}, direction:'down'},
            {type:"Soldier", position:{x:6,y:1}, direction:'down'},
            {type:"Hoplite", position:{x:7,y:1}, direction:'down'},
            {type:"Hoplite", position:{x:8,y:1}, direction:'down'},
            {type:"Hoplite", position:{x:9,y:1}, direction:'down'},
            {type:"Hoplite", position:{x:10,y:1}, direction:'down'}
          ]
        }, 
        "conf_defender" : { 
          units : [ 
            {type:"Archer", position:{x:0,y:19}, direction:'up'},
            {type:"Soldier", position:{x:1,y:19}, direction:'up'},
            {type:"Hoplite", position:{x:2,y:19}, direction:'up'},
            {type:"Archer", position:{x:3,y:19}, direction:'up'},
            {type:"Archer", position:{x:4,y:19}, direction:'up'},
            {type:"Archer", position:{x:5,y:19}, direction:'up'},
            {type:"Archer", position:{x:6,y:19}, direction:'up'},
            {type:"Archer", position:{x:7,y:19}, direction:'up'},
            {type:"Archer", position:{x:8,y:19}, direction:'up'},
            {type:"Soldier", position:{x:1,y:18}, direction:'up'},
            {type:"Soldier", position:{x:2,y:18}, direction:'up'},
            {type:"Soldier", position:{x:3,y:18}, direction:'up'},
            {type:"Soldier", position:{x:4,y:18}, direction:'up'},
            {type:"Soldier", position:{x:5,y:18}, direction:'up'},
            {type:"Soldier", position:{x:6,y:18}, direction:'up'},
            {type:"Hoplite", position:{x:7,y:18}, direction:'up'},
            {type:"Hoplite", position:{x:8,y:18}, direction:'up'},
            {type:"Hoplite", position:{x:9,y:18}, direction:'up'},
            {type:"Hoplite", position:{x:10,y:18}, direction:'up'}
          ]
        }, 
        battlefield : tiles
      });
      // return cb(null, data);
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
  }, function(err, res, body){
    if (!err && res.statusCode == 200) {
      var data = JSON.parse(body);
      return cb(null, data);
    }
    return cb('Some error occurred', false);
  });
}

module.exports = mod_temp = function (settings) {
  base_url = settings.base_url_webservice;
  return {
    info : function (battle_id, cb) {
      info(battle_id, cb);
    },
    result : function (battle_id, data, cb) {
      result(battle_id, data, cb);
    }
  };
};