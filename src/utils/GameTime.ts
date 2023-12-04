import store from "@/store";

export default abstract class {
  static get start(): number {
    return store.getters.gameData.start_time || 0;
  }

  static get current(): number {
    return new Date().getTime() + this.mistake;
  }

  static get duration(): number {
    return store.getters.roomData.room_config.game_time * 60 * 1000;
  }

  static get mistake(): number {
    return store.getters.heartBeat.timeMistake || 0;
  }

  static get pauseBegin(): number {
    return store.getters.gameData.pause_begin_ms || 0;
  }

  static get totalPause(): number {
    return store.getters.gameData.total_pause_time || 0;
  }

  static get passed(): number {
    if (this.pauseBegin) {
      return this.pauseBegin - this.start - this.totalPause;
    } else {
      return this.current - this.start - this.totalPause;
    }
  }

  static get countdown(): number {
    return (store.getters.roomData.room_config.countdown || 0) * 1000;
  }

  static get standby(): number {
    if (this.countdown > 0) {
      if (this.passed < this.countdown) {
        return this.passed;
      } else {
        return this.countdown;
      }
    }
    return 0;
  }

  static get main(): number {
    if (this.countdown > 0) {
      if (this.passed < this.countdown) {
        return 0;
      } else {
        return this.passed - this.countdown;
      }
    }
    return this.passed;
  }

  static get timeout(): number {
    const timeout = this.main - this.duration;
    if (timeout < 0) {
      return 0;
    } else {
      return timeout;
    }
  }

  static getServerTime(time: number): number {
    return time + this.mistake;
  }
}
