/*jslint node: true */
"use strict";
var GameRunner = require('./game_runner');

//missing using battle_ws to save when the game finishes (save to battle_ws.result)
var battle_ws = require('../webservices_clients/battle');
var amqp_helpers = require('../amqp_helpers');

module.exports = function (amqp_connection, webservices_clients) {
  var bm_queue = 'bm_queue';
  var game_runners = {};
  var bm_channel;
  var battle_ws = webservices_clients.battle;
  amqp_connection.createChannel().then(function (ch) {
    bm_channel = ch;
    ch.assertQueue(
      bm_queue, {durable : true}
    ).then(function() {
      ch.prefetch(1);
    }).then(function() {
      ch.consume(bm_queue, assign_bm_to_clients, { noAck : false });
    });
  });
  function assign_bm_to_clients(msg) {
    var data = JSON.parse(msg.content.toString());
    var battle_id = data.battle_id;
    var ex = 'battle_toclient';
    var PRE_ROUTE = '1v1.manager.';
    var PRE_ROUTE_EMMIT = '1v1.client.';
    var emmit_channel, consume_channel, channel_queue;
    var local_runner;
    var queue_bindings = [ PRE_ROUTE + battle_id ];
    var client_route = PRE_ROUTE_EMMIT + battle_id;
    var fixed_game_data;
    //we can now start the new manager. Tell that we can setup more managers now.
    bm_channel.ack(msg);
    amqp_helpers.create_default_channels(
          amqp_connection, ex, queue_bindings, 
          battle_manager_consumer, function (em_ch, cs_ch, ch_qu) {
      emmit_channel = em_ch;
      consume_channel = cs_ch;
      channel_queue = ch_qu;
      battle_ws.info(battle_id, function (err, game_data) {
        //handle errors
        if (err !== null) return;
        //setup game runner
        fixed_game_data = {
          tiles : game_data.battlefield,
          attacker : {
            id : game_data.attacker,
            sp_start : game_data.sp_attacker,
            units : game_data.conf_attacker.units
          },
          defender : {
            id : game_data.defender,
            sp_start : game_data.sp_defender,
            units : game_data.conf_defender.units
          }
        };
        local_runner = new GameRunner(fixed_game_data);
        game_runners[battle_id] = local_runner;
        emmit_channel.publish(ex, client_route, amqp_helpers.data_builder({
          type : "server ready",
          data : {
            game_data : fixed_game_data
          }
        }));
        //now lets start receiving events and pass them either to game_runner or to the clients
        
      });
    });
    

    function battle_manager_consumer(msg) {
      var data = JSON.parse(msg.content.toString());
      console.log(data);
      //fucking refactor this shit!
      //no joking around, data needs to be processed according to real GameRunner API
      if (data.data.type == 'get_data') {
        emmit_channel.publish(ex, client_route, amqp_helpers.data_builder({
          type : "server ready",
          data : {
            game_data : fixed_game_data
          }
        }));
      }
      if (data.data.type == "game_data") {
        local_runner.processEvent(data.data, function(res) {
          //if res includes something about game_ended or some shit,
          //don't forget to close channels
          emmit_channel.publish(ex, client_route, amqp_helpers.data_builder({
            type : "game_result",
            data : res
          }));
        });
      }
    }
  }
};