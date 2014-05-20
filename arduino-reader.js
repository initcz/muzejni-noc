var serialport = require('serialport');
var SerialPort = serialport.SerialPort;

function findArduinoComName(callback) {
	var adruinoPnpIdRegex = /Arduino_Leonardo/;
	var listRetryInterval = 2000; // ms

	(function listPorts() {
		serialport.list(function (err, ports) {
			var validPorts;

			if (err) {
				return callback(err);
			}

			validPorts = ports.filter(function (port) {
				return adruinoPnpIdRegex.test(port.pnpId);
			});

			if (validPorts.length > 0) {
				callback(null, validPorts[0].comName);
			}
			else {
				console.error('No Arduino on serial-port found, trying again after %d ms.', listRetryInterval);
				setTimeout(listPorts, listRetryInterval);
			}
		});
	}());
}

function startReadData(comName, server) {
	var arduinoBootloadDelay = 10000; // 10s

	console.log('Arduino found on %s. Waiting %d ms just for case bootloader isn\'t finished yet.', comName, arduinoBootloadDelay);
	setTimeout(function () {
		var arduinoPort = new SerialPort(comName, {
			baudrate: 9600,
			parser: serialport.parsers.readline('\n')
		});

		arduinoPort.on('open', function () {
			console.log('Port %s opened.', comName);
			arduinoPort.on('data', function (data) {
				console.log('Data received: %s', data);
				server.emit('arduinoData', data);
			});
		});
	}, arduinoBootloadDelay);
}

module.exports = function start(server) {
	findArduinoComName(function (err, comName) {
		if (err) {
			console.error(err);
			process.exit(-1);
		}

		startReadData(comName, server);
	});
};
