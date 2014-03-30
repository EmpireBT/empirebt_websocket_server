/*jslint node: true */
"use strict";

var amqp_helpers = require('../amqp_helpers');

module.exports = function (io, amqp_connection, webservices_clients) {
  var authorization = webservices_clients.authorization;
  var presence = webservices_clients.presence;
  var battle_ws = webservices_clients.battle;
  io.of('/chat_empire')
    .authorization(authorization.chat_empire)
    .on('connection', function (socket) {
      var user_id = socket.handshake.user_id;
      //var token = socket.handshake.token;
      var empire_id = socket.handshake.empire_id;
      var ex = 'chat_empire';
      var PRE_ROUTE = 'empire';
      var emmit_channel, consume_channel, channel_queue;

      var queue_bindings = [PRE_ROUTE + '.presence', PRE_ROUTE + '.talk.' + empire_id];
      amqp_helpers.create_default_channels(
          amqp_connection, ex, queue_bindings, 
          amqp_helpers.empire_amqp_handler(socket), function (em_ch, cs_ch, ch_qu) {
        emmit_channel = em_ch;
        consume_channel = cs_ch;
        channel_queue = ch_qu;

        amqp_helpers.presence_helper(emmit_channel, ex, PRE_ROUTE, amqp_helpers.LOGIN, user_id);
        //we don't really need the result of the callback...
        presence.chat_empire_connected(user_id, 'true', empire_id, function (){});
        socket.on('send message', amqp_helpers.send_message_helper(
          emmit_channel, ex, user_id, PRE_ROUTE + '.talk.', empire_id));
        socket.on('disconnect', amqp_helpers.disconnect_helper_empire(
          emmit_channel, consume_channel, channel_queue, ex, PRE_ROUTE, user_id, presence.chat_empire_connected, empire_id)

        );
      });
    }
  );
};