/*jslint node: true */
"use strict";
var app = require('http').createServer(), 
    io = require('socket.io').listen(app), 
    amqp = require('amqplib');

var settings = {
  BASE_URL : 'http://10.20.217.29:8000/'
};

var webservices_clients = {
  authorization : require('./webservices_clients/authorization')(settings),
  presence : require('./webservices_clients/presence')(settings),
  battle : require('./webservices_clients/battle')(settings)
};
var amqp_connection = null;
app.listen(8000);


io.configure(function () {
  io.set('authorization', webservices_clients.authorization.general);
});
amqp.connect('amqp://localhost').then(function (conn) {
  process.once('SIGINT', function () { conn.close(); });
  amqp_connection = conn;
  require('./io_modules/battle_toclient')(io, amqp_connection, webservices_clients);
  require('./io_modules/chat_empire')(io, amqp_connection, webservices_clients);
  require('./io_modules/chat_oneonone')(io, amqp_connection, webservices_clients);
  require('./battle_manager/server')(amqp_connection, webservices_clients);
}).then(null, console.warn);
