#!/usr/bin/node
var path = require('path');
var express = require('express');
var compression = require('compression');
var http = require('http');


var app = express();
var server = http.Server(app);

app.use(compression());
app.use('/', express.static(path.join(__dirname, 'public')));

var SSE = require('sse');
var clients = [];
server.once('listening', function() {
  var sse = new SSE(server);
  sse.on('connection', function(client) {
    clients.push(client);
    client.on('close', function () {
      clients.splice(clients.indexOf(client), 1);
    });
  });
});

server.on('arduinoData', function(data) {
  clients.forEach(function(client) {
    client.send(data);
  });
});

//var arduinoReader = require('./arduino-reader');
var arduinoReader = require('./arduino-reader-mock');
arduinoReader(server);

server.listen(process.env.PORT || 8080);
