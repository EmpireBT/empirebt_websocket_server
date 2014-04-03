/*jslint node: true */
"use strict";
var app = require('http').createServer(), 
    io = require('socket.io').listen(app), 
    amqp = require('amqplib'),
    fs = require('fs');

var settings = JSON.parse(fs.readFileSync('config.json').toString());


var webservices_clients = {
  authorization : require('./webservices_clients/authorization')(settings),
  presence : require('./webservices_clients/presence')(settings),
  battle : require('./webservices_clients/battle')(settings)
};
var amqp_connection = null;

app.listen(settings.port);

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
