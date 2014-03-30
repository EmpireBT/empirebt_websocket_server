/*global io, $, console */
$(function () {
  "use strict";
  var $user_id = $('#user_id'),
      $token = $('#token'),
      $battle_id = $('#battle_id'),
      $empire_id = $('#empire_id'),
      //$username = $('#username'),
      $message = $('#message'),
      $send_message_btn = $('#send_message_btn'),
      $destination_id = $('#destination_id');
  //$user_id.val(parseInt(Math.random() * 1000000000000));
  //$token.val(parseInt(Math.random() * 1000000000000));
  
  //var username = $username.val();
  var destination_id = $destination_id.val();

  //init(user_id, token);
  $('#authorize').click(function () {
    init($user_id.val(), $token.val(), $battle_id.val(), $empire_id.val());
  });

  function init(user_id, token, battle_id, empire_id) {
    var base_url = 'http://localhost:8000';
    var battle = io.connect(base_url + 
            '/battle?token=' + token + '&user_id=' + user_id + 
            '&battle_id=' + battle_id + "&empire_id=" + empire_id),
        chat_empire = io.connect(base_url + 
          '/chat_empire'), 
        chat_oneonone = io.connect(base_url + 
            '/chat_oneonone');
    //var general_data = {};
    chat_empire.on('connect', function () {
      console.log("chat_empire connect.");
    }).on('connect_failed', function () {
      console.log("chat_empire connect_failed");    
    });

    chat_oneonone.on('connect', function () {
      console.log("chat_oneonone connect.");
    }).on('connect_failed', function () {
      console.log("chat_oneonone connect_failed");    
    }).on('receive message', function (data) {
      console.log('receive message', data);
    }).on('presence logout', function (data) {
      console.log('presence logout', data);
    }).on('presence login', function (data) {
      console.log('presence login', data);
    });

    $destination_id.change(function() {
      destination_id = $(this).val();
    });

    $send_message_btn.click(function() {
      console.log('send message', { 
        destination_id : destination_id, 
        message : $message.val() 
      });
      chat_oneonone.emit('send message', { 
        destination_id : destination_id, 
        message : $message.val() 
      });
    });

    battle.on('connect', function () {
      console.log("battle connect.");
    }).on('connect_failed', function () {
      console.log("battle connect_failed");    
    }).on('server ready', function (data) {
      console.log('battle receive message', data);
    });
  }
});