/*jslint node: true */
"use strict";

var amqp_helpers = require('../amqp_helpers');

module.exports = function (io, amqp_connection, webservices_clients) {
  var bm_emmit_channel;
  var bm_queue = 'bm_queue';
  var authorization = webservices_clients.authorization;
  var presence = webservices_clients.presence;
  var battle_ws = webservices_clients.battle;
  amqp_connection.createChannel().then(function (ch) {
    bm_emmit_channel = ch;
    bm_emmit_channel.assertQueue(
      bm_queue, { durable : true }
    );
  });
  io.of('/battle')
    .authorization(authorization.battle)
    .on('connection', function (socket) {

      var user_id = socket.handshake.user_id;
      //var token = socket.handshake.token;
      var battle_id = socket.handshake.battle_id;
      var ex = 'battle_toclient';
      var PRE_ROUTE = '1v1.client.';
      var emmit_channel, consume_channel, channel_queue;

      var queue_bindings = [ PRE_ROUTE + battle_id ];

      if (!socket.handshake.battle_manager_exists) {
        //ask someone to be a battle_manager!
        amqp_helpers.create_battle_manager(bm_emmit_channel, battle_id, bm_queue);
      }
      
      amqp_helpers.create_default_channels(
          amqp_connection, ex, queue_bindings, 
          amqp_helpers.battle_amqp_handler(socket), function (em_ch, cs_ch, ch_qu) {
        emmit_channel = em_ch;
        consume_channel = cs_ch;
        channel_queue = ch_qu;
        socket.on('send message', 
          amqp_helpers.send_battle_toclient_helper(emmit_channel, ex, 'manager', user_id, battle_id)
        );
        socket.on('disconnect', function(){
          amqp_helpers.send_battle_toclient_helper(emmit_channel, ex, 'manager', user_id, battle_id)({
            type : 'disconnect'
          });
          amqp_helpers.send_battle_toclient_helper(emmit_channel, ex, 'client', user_id, battle_id)({
            type : 'disconnect'
          });
          //channel_queue.close();
          emmit_channel.close();
          consume_channel.close();
        });
        
      });
    }
  );
};