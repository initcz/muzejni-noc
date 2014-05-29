#!/usr/bin/node
var path = require('path');
var express = require('express');
var compression = require('compression');
var http = require('http');
var socketIo = require('socket.io');

var app = express();
var server = http.Server(app);
var io = socketIo.listen(server);

io.set('transports', ['websocket']);
io.enable('browser client minification');
io.enable('browser client etag');
io.enable('browser client gzip');
io.set('log level', 0);
io.set('log colors', false);

app.use(compression());
app.use('/', express.static(path.join(__dirname, 'public')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// "pre-calibrated" defaults
var controlParams = require('./control-params.json');

var SSE = require('sse');
var clients = [];
server.once('listening', function() {
  var sse = new SSE(server);
  sse.on('connection', function(client) {
    client.send('cpinit@' + JSON.stringify(controlParams));

    clients.push(client);
    client.on('close', function () {
      clients.splice(clients.indexOf(client), 1);
    });
  });
});

server.on('arduinoData', function(data) {
  clients.forEach(function(client) {
    client.send('d@' + data);
  });
});
server.on('controlParamsChange', function(change) {
  clients.forEach(function(client) {
    client.send('cpch@' + JSON.stringify(change));
  });
});

//var arduinoReader = require('./arduino-reader');
var arduinoReader = require('./arduino-reader-mock');
arduinoReader(server);

io.on('connection', function(socket) {
  socket.emit('controlParams', controlParams);
  socket.on('controlParamsChange', function(data) {
    controlParams[data.index][data.property] = data.value;
    server.emit('controlParamsChange', data);
  });
});

server.listen(process.env.PORT || 8080);
