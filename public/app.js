(function() {
  var VALUES_COUNT = 5;
  var bodySize;
  var i;

  window.addEventListener('resize', onResize);
  function onResize() {
    bodySize = [
      document.body.clientWidth,
      document.body.clientHeight
    ];
  }
  onResize();

  function preparePlayFn() {
    var audio1 = T('audio', { loop:true }).load('sound/drum.wav');
    var audio2 = T('audio', { loop:true }).load('sound/guitar.wav');
    var filter1 = T('eq', {
      params: {
        hpf: [50, 1],
        lmf: [828, 1.8, 18.3],
        mf: [2400, 2.2, -24, 5],
        lpf: [5000, 1.1]
      }
    }, audio1);
    var filter2 = T('eq', {
      params: {
        hpf: [50, 1],
        lmf: [828, 1.8, 18.3],
        mf: [2400, 2.2, -24, 5],
        lpf: [5000, 1.1]
      }
    }, audio2);
    var clip1 = T('clip', { minmax: 0.5, mul: 1 }, filter1);
    var clip2 = T('clip', { minmax: 0.5, mul: 1 }, filter2);
    var clips = T('+', clip1, clip2);
    var filter3 = T('reverb', { room: 1, damp: 1, mix: 0.5 }, clips);

    return function play() {
      filter3.play();

      var values = [0, 0, 0, 0, 0];
      return function setValues(newValues) {
        var i, value;

        for (i = 0; i < newValues.length; i++) {
          value = newValues[i];
          if (value !== undefined) {
            values[i] = value;
          }
        }

        filter3.set('room', (100 - values[2]) / 100);
        filter3.set('mix', (100 - values[2]) / 150);

        clip1.set('mul', values[0] / 100);
        clip2.set('mul', values[4] / 100);

        //clip1.set('mul', Math.max(values[0], values[2]) / 100);
        //clip2.set('mul', Math.max(values[4], values[2]) / 100);

        filter1.setParams(2, values[1] * 20, 1.8, 18.3);
        filter2.setParams(2, values[3] * 20, 1.8, 18.3);

        filter1.setParams(3, values[1] * 500, values[1] * 5, values[1] - 50, 5);
        filter2.setParams(3, values[3] * 500, values[3] * 5, values[1] - 50, 5);
      };
    };
  }

  function prepareAnimationFn(playFn) {
    var letterEls = Array.apply(0, Array(VALUES_COUNT)).map(function(_, index) {
      return document.getElementById('letter' + (index + 1));
    });
    var letterInnerEls = letterEls.map(function(letterEl) {
      return letterEl.children[0];
    });
    var sensorEls = Array.apply(0, Array(VALUES_COUNT)).map(function(_, index) {
      return document.getElementById('sensor' + (index + 1));
    });
    var letterSizes = [];

    window.addEventListener('resize', onResize);
    function onResize() {
      letterInnerEls.forEach(function(letterEl, index) {
        if (letterEl.complete) {
          gatherSizes();
        }
        else {
          letterSizes[index] = { width: 0, height: 0 };
          letterEl.addEventListener('load', gatherSizes);
        }

        function gatherSizes() {
          var originalStyle = {
            top: letterEl.style.top,
            width: letterEl.style.width
          };
          var rect = letterEl.getBoundingClientRect();

          letterEl.style.top = 'initial';
          letterEl.style.width = 'initial';
          letterSizes[index] = {
            width: rect.width,
            height: rect.height
          };
          letterEl.style.top = originalStyle.top;
          letterEl.style.width = originalStyle.width;
        }
      });
    }
    onResize();

    function animate(value, index) {
      index = Math.min(Math.max(index, 0), sensorEls.length - 1);
      value = Math.min(Math.max(value, 0), 100);
      var sensorEl = sensorEls[index];
      var letterEl = letterEls[index];
      var letterInnerEl = letterInnerEls[index];
      var letterBottom, letterTopPx, letterHeight, letterSqueezedWidth;

      sensorEl.style.top = (100 - value) + '%';
      letterBottom = letterTween(value);
      letterEl.style.bottom = letterBottom + '%';

      // squeezing
      letterTopPx = Math.round((100 - letterBottom) * (bodySize[1] / 100));
      letterHeight = letterSizes[index].height;
      if (letterTopPx < letterSizes[index].height) {
        letterEl.style.top = '0';
        letterEl.style.bottom = (letterBottom - 1) + '%';
        letterSqueezedWidth = Math.round((letterSizes[index].height - letterTopPx) / letterHeight * 50) + 50;
        letterInnerEl.style.width = letterSqueezedWidth + '%';
      }
      else {
        letterEl.style.top = null;
        letterInnerEl.style.width = null;
      }
    }

    var letterHiddenBorderStart = -50;
    var letterHiddenBorder = 20;
    var letterIncreaseBorder = 50;
    function letterTween(y) {
      var step, offset;
      if (y < letterHiddenBorder) {
        return letterHiddenBorderStart;
      }
      else if (y < letterIncreaseBorder) {
        step = letterIncreaseBorder / (letterIncreaseBorder - letterHiddenBorder);
        offset = (y - letterHiddenBorder);
        return Math.round(offset * step);
      }
      else {
        return y;
      }
    }

    var setValuesToPlayFn = (playFn ? playFn() : undefined);
    setInterval(function animationInterval() {
      var i;
      if (buffer.length > 0) {
        (setValuesToPlayFn ? setValuesToPlayFn(buffer) : undefined);
        for (i = 0; i < buffer.length; i++) {
          if (buffer[i] !== undefined) {
            animate.call(null, buffer[i], i);
          }
        }
        buffer.length = 0;
      }
    }, 50);

    var buffer = [];
    return function(value, index) {
      index = Math.min(Math.max(index, 0), sensorEls.length - 1);
      buffer[index] = value;
    };
  }
  var animateFn = prepareAnimationFn(/*preparePlayFn()*/);

  function attachSse(animateFn) {
    var es = new EventSource('/sse');
    var controlParams = Array.apply(0, Array(VALUES_COUNT)).map(function() { return { min: 0, max: 600 } });

    es.onmessage = function (event) {
      var parts = event.data.split('@');
      var data = parts[1];
      switch (parts[0]) {
        case 'd':
          onArduinoData(data);
          break;
        case 'cpinit':
          controlParams = JSON.parse(data);
          break;
        case 'cpch':
          data = JSON.parse(data);
          controlParams[data.index][data.property] = data.value;
          break;
      }
    };

    function onArduinoData(data) {
      var values = data.split(';');
      values.length = VALUES_COUNT;
      values = values.map(function (value, index) {
        var controlParam = controlParams[index];
        var range = (controlParam.max - controlParam.min);

        value = parseInt(value, 10);
        value = (value - controlParam.min);
        value = Math.max(Math.min(value, range), 0);

        return Math.floor((value / range) * 100);
      });

      values.forEach(animateFn);
    }
  }
  attachSse(animateFn);

  // NOTE: Just for local testing
  /*var generate = true;
  function randomDataGenerator() {
    var index = Math.floor(Math.random() * 5);
    var value = Math.floor(Math.random() * 100);
    if (generate) {
      animateFn(value, index);
    }
  }
  setInterval(randomDataGenerator, 50);

  function attachMouseControl(animateFn) {
    var isMouseDown = false;
    document.addEventListener('mousedown', function(event) {
      isMouseDown = true;
      countColumnAndPercent(event);
      event.stopPropagation();
      event.preventDefault();
      generate = false;
    });
    document.addEventListener('mousemove', function(event) {
      if (isMouseDown) {
        countColumnAndPercent(event);
      }
    });
    document.addEventListener('mouseup', function() {
      isMouseDown = false;
      generate = true;
    });

    function countColumnAndPercent(event) {
      var index, value;

      index = Math.floor((event.clientX / bodySize[0]) * VALUES_COUNT);
      value = 100 - Math.max(Math.min(Math.round(event.clientY / bodySize[1] * 100), 100), 0);

      animateFn(value, index);
    }
  }
  attachMouseControl(animateFn);*/

}());
