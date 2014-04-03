/*jslint node: true */
"use strict";
var app = require('http').createServer(), 
    io = require('socket.io').listen(app), 
    amqp = require('amqplib'),
    fs = require('fs');

<<<<<<< HEAD
var settings = JSON.parse(fs.readFileSync('config.json').toString());
=======
var settings = {
  BASE_URL : 'http://10.20.217.29:8000/',
  PORT : '8000'
};
>>>>>>> f90353df1b4bddc8e0c4207856c0ac9ecb60f51c

var webservices_clients = {
  authorization : require('./webservices_clients/authorization')(settings),
  presence : require('./webservices_clients/presence')(settings),
  battle : require('./webservices_clients/battle')(settings)
};
var amqp_connection = null;
<<<<<<< HEAD
app.listen(settings.port);
=======
app.listen(settings.PORT);
>>>>>>> f90353df1b4bddc8e0c4207856c0ac9ecb60f51c


io.configure(function () {
  io.set('authorization', webservices_clients.authorization.general);
});
amqp.connect(settings.amqp_server).then(function (conn) {
  process.once('SIGINT', function () { conn.close(); });
  amqp_connection = conn;
  if (settings.io.battle_toclient) {
    require('./io_modules/battle_toclient')(io, amqp_connection, webservices_clients);
  }
  if (settings.io.chat_empire) {
    require('./io_modules/chat_empire')(io, amqp_connection, webservices_clients);  
  }
  if (settings.io.chat_oneonone) {
    require('./io_modules/chat_oneonone')(io, amqp_connection, webservices_clients);  
  }
  if (settings.amqp.battle_manager) {
    require('./battle_manager/server')(amqp_connection, webservices_clients);  
  }
}).then(null, console.warn);
