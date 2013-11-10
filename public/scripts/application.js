angular.module("fics_client", ["ui.bootstrap", "proxy", "console", "chat"]);

function LoginCtrl($scope, Proxy) {
  $scope.login_as_guest = function() {
    Proxy.login({});
  };

  $scope.login_with_credentials = function(user_data) {
    Proxy.login(user_data);
  };
};

function ConsoleCtrl($scope, Console) {
  $scope.output = "";

  (function updateOutput() {
    $scope.output = Console.get();
    setTimeout(updateOutput, 1000);
  })();
};

function GlobalChatCtrl($scope, Chat) {
  $scope.channels = {};

  (function updateChannels() {
    $scope.channels = Chat.channels();
    setTimeout(updateChannels, 1000);
  })();
}

angular.module("proxy", []).factory("Proxy", function(Console, Chat) {
  var socket = this.socket = new SockJS("/socket");
  var socket_open = false;

  socket.onopen = function() {
    socket_open = true;
  };

  socket.onclose = function() {
    socket_open = false;
  };

  socket.onmessage = function(e) {
    if (e.type !== "message") {
      return;
    }

    var message = JSON.parse(e.data);

    switch(message.operation) {
    case "raw":
      Console.append(message.data);
      break;
    case "channel_list":
      Chat.set_channels(message.data);
      break;
    }
  };

  this.login = function(user_data) {
    send_message("login", user_data);
  };

  function send_message(operation, params) {
    ensure_socket(function() {
      socket.send(JSON.stringify({ operation: operation, params: params }));
    });
  }

  function ensure_socket(cb) {
    wait_for(function() { return socket_open; }, cb)
  }

  function wait_for(condition, cb) {
    (function wait() {
      if (condition()) cb();
      else setTimeout(wait, 50);
    })();
  }

  return this;
});

angular.module("console", []).factory("Console", function() {
  var output = "";

  return {
    get: function() { return output },
    append: function(data) { output += data }
  };
});

angular.module("chat", []).factory("Chat", function() {
  var channels;

  return {
    channels: function() { return channels },
    set_channels: function(val) { channels = val }
  }
});
