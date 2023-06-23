const EventEmitter = require("events");

class RobotData extends EventEmitter {
  constructor() {
    super();
    this.emitters = [];
  }

  add(socket, dataType) {
    this.emitters.push({
      socket,
      dataType,
      trigger: (eventName, newData) => {
        socket.emit(`${eventName}`, newData);
      },
    });
  }

  remove(ID) {
    this.emitters = this.emitters.filter((emitter) => emitter.socket.id !== ID);
  }
}

const robotData = new RobotData();

module.exports = { robotData };
