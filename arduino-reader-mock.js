module.exports = function start(server) {
  var data = [];
  var j = 0;
  var averageCount = 5;
	setInterval(function generateData() {
		var i, k, ln = 5;
    var result = [];
    var value;

		for (i = 0; i < ln; i++) {
      if (i === 0) {
        // for testing of control params
        value = 400 + Math.floor(Math.random() * 400);
      }
      else {
        value = Math.floor(Math.random() * 600);
      }

      data[i] = data[i] || [];
			data[i][j] = value;
			//data[i][j] = ((4 - i) * 100) + Math.floor(Math.random() * 200);
			//data[i][j] = 100;

      for (k = 0; k < data[i].length; k++) {
        result[i] = result[i] || 0;
        result[i] += data[i][k];
      }
      result[i] = Math.round(result[i] / data[i].length);
		}
    j += 1;
    j = (j >= averageCount ? 0 : j);

		server.emit('arduinoData', result.join(';') + ';');
	}, 100);
};
