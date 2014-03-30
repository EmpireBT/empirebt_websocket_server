/*jslint node: true */
"use strict";
var amqp_helpers;
module.exports = amqp_helpers = {
  LOGIN : 'login',
  LOGOUT : 'logout',
  DEFAULT_EXCHANGE_TYPE : 'topic',
  create_default_channels : function (amqp_connection, ex, queue_bindings, consumer, cb) {
    var emmit_channel, consume_channel, channel_queue;
    amqp_connection.createChannel().then(function (ch) {
      emmit_channel = ch;
      ch.assertExchange(
        ex, amqp_helpers.DEFAULT_EXCHANGE_TYPE, { durable : false }
      );
    }).then(function() {
      amqp_connection.createChannel().then(function (ch) {
      consume_channel = ch;
      ch.assertExchange(ex, amqp_helpers.DEFAULT_EXCHANGE_TYPE, {durable : false})
        .then(function () {
          return ch.assertQueue('', { exclusive : true });
        })
        .then(function (qok) {
          var queue = qok.queue;
          channel_queue = qok.queue;
          for (var i in queue_bindings) {
            ch.bindQueue(queue, ex, queue_bindings[i]);
          }
          ch.consume(queue, consumer, { noAck : true});
          cb(emmit_channel, consume_channel, channel_queue);
        });
      });
    });
  },
  create_battle_manager : function (bm_emmit_channel, battle_id, bm_queue) {
    var data = { battle_id : battle_id };
    bm_emmit_channel.sendToQueue(bm_queue, 
      amqp_helpers.data_builder(data), { deliveryMode: true });
  },
  presence_helper : function (emmit_channel, exchange, route, type, id, username) {
    var data_to_send = {
      data : {
        user_id : id,
        username : username
      },
      type : 'presence ' + type
    };
    var message = new Buffer(JSON.stringify(data_to_send));
    emmit_channel.publish(exchange, route + ".presence", message);
  },
  oneonone_amqp_handler : function (socket) {
    return function (msg) {
      var data = JSON.parse(msg.content.toString());
      socket.emit(data.type, data.data);
    };
  },
  empire_amqp_handler : function (socket) {
    return amqp_helpers.oneonone_amqp_handler(socket);
  },
  battle_amqp_handler : function (socket) {
    return amqp_helpers.oneonone_amqp_handler(socket);
  },
  data_builder : function (data) {
    var bdata = new Buffer(JSON.stringify(data));
    return bdata;
  },
  send_message_helper : function (emmit_channel, ex, user_id, binding, empire_id) {
    return function (data) {
      var destination_id = data.destination_id;
      var binding_temp = "";
      if (empire_id) {
        binding_temp = binding + empire_id;
        destination_id = empire_id;
      }
      else {
        binding_temp = binding + destination_id;
      }
      var data_to_send = { 
        data : {
          from_id : user_id,
          destination_id : destination_id,
          message : data.message
        },
        type : 'receive message'
      };

      var message = amqp_helpers.data_builder(data_to_send);
      emmit_channel.publish(ex, binding_temp, message);
    };
  },
  send_battle_toclient_helper : function(emmit_channel, ex, target, user_id, battle_id) {
    return function (data) {
      var binding = '1v1.' + target + '.' + battle_id;
      var data_to_send = {
        from : user_id,
        data : data
      };
      var message = amqp_helpers.data_builder(data_to_send);
      emmit_channel.publish(ex, binding, message);
    };
  },
  disconnect_helper : function (emmit_channel, consume_channel, channel_queue, exchange, pre_route, user_id, ws) {
    return function () {
      amqp_helpers.presence_helper(emmit_channel, exchange, pre_route, amqp_helpers.LOGOUT, user_id);
      ws(user_id, 'false', function (){});
      consume_channel.deleteQueue(channel_queue);
      emmit_channel.close();
      consume_channel.close();
    };
  },
  disconnect_helper_empire : function (emmit_channel, consume_channel, channel_queue, exchange, pre_route, user_id, ws, empire_id) {
    return function () {
      amqp_helpers.presence_helper(emmit_channel, exchange, pre_route, amqp_helpers.LOGOUT, user_id);
      ws(user_id, 'false', empire_id, function (){});
      consume_channel.deleteQueue(channel_queue);
      emmit_channel.close();
      consume_channel.close();
    };
  }
};