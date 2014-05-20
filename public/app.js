(function() {
  var VALUES_COUNT = 5;
  var bodySize;

  window.addEventListener('resize', onResize);
  function onResize() {
    bodySize = [
      document.body.clientWidth,
      document.body.clientHeight
    ];
  }
  onResize();

  function prepareAnimationFn() {
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

    setInterval(function animationInterval() {
      var i;
      if (buffer.length > 0) {
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
  var animateFn = prepareAnimationFn();

  /*function attachSse(animateFn) {
    var es = new EventSource('/sse');
    var MAX_VALUE = 600;

    es.onmessage = function (event) {
      var values = event.data.split(';');
      values.length = VALUES_COUNT;
      values = values.map(function (value) {
        value = parseInt(value, 10);
        return Math.floor((value / MAX_VALUE) * 100);
      });

      values.forEach(animateFn);
    };
  }
  attachSse(animateFn);*/

  var generate = true;
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
  attachMouseControl(animateFn);

}());
