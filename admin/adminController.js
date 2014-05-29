(function() {
  var admin = angular.module('admin', [
    'ngTouch',
    'vr.directives.slider',
    'btford.socket-io'
  ]);

  admin.factory('socket', function (socketFactory) {
    return socketFactory();
  });

  admin.controller('AdminController', ['$scope', '$timeout', 'socket', function($scope, $timeout, socket) {
    var ctrl = this;
    var TIMEOUT = 200;
    var i, changeTimeout;
    var changesBuffer = [];

    $scope.controlParams = ctrl.controlParams = [];
    for (i = 0; i < 5; i++) {
      ctrl.controlParams.push({ min: 0, max: 600 });
    }

    function getWatcherFn(index) {
      return function watcherFn(oldObject, newObject) {
        if (changeTimeout) {
          $timeout.cancel(changeTimeout);
        }
        changeTimeout = $timeout(sendChanges, TIMEOUT);

        changesBuffer[index] = changesBuffer[index] || {};
        if (newObject.min !== oldObject.min) {
          changesBuffer[index].min = true;
        }
        if (newObject.max !== oldObject.max) {
          changesBuffer[index].max = true;
        }
      };
    }

    function sendChanges() {
      var i, change;

      changeTimeout = undefined;
      for (i = 0; i < changesBuffer.length; i++) {
        change = changesBuffer[i];
        if (change) {
          if (change.min) {
            socket.emit('controlParamsChange', { index: i, property: 'min', value: ctrl.controlParams[i].min });
          }
          if (change.max) {
            socket.emit('controlParamsChange', { index: i, property: 'max', value: ctrl.controlParams[i].max });
          }
        }
      }
      changesBuffer.length = 0;
    }

    socket.on('controlParams', function(data) {
      var i;
      for (i = 0; i < data.length; i++) {
        ctrl.controlParams[i].min = data[i].min;
        ctrl.controlParams[i].max = data[i].max;
        $scope.$watchCollection('controlParams[' + i + ']', getWatcherFn(i));
      }
    });
  }]);

}());
