interface Storage {
  set: { (key: string, value: any): void };
  get: { (key: string): any };
  remove: { (key: string): void };
  clear: { (): void };
  has: { (key: string): boolean };
}

class LocalStorage implements Storage {
  set(key: string, value: any) {
    if (value instanceof Object || value instanceof Array) {
      window.localStorage.setItem(key, JSON.stringify(value));
    } else {
      window.localStorage.setItem(key, value);
    }
  }
  get(key: string) {
    const data = window.localStorage.getItem(key);
    try {
      return JSON.parse(data || "");
    } catch (e) {
      return data;
    }
  }
  remove(key: string) {
    window.localStorage.removeItem(key);
  }
  clear() {
    window.localStorage.clear();
  }
  has(key: string) {
    return window.localStorage.hasOwnProperty(key);
  }
}

class SessionStorage implements Storage {
  set(key: string, value: any) {
    if (value instanceof Object || value instanceof Array) {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } else {
      window.sessionStorage.setItem(key, value);
    }
  }
  get(key: string) {
    const data = window.localStorage.getItem(key);
    try {
      return JSON.parse(data || "");
    } catch (e) {
      return data;
    }
  }
  remove(key: string) {
    window.sessionStorage.removeItem(key);
  }
  clear() {
    window.sessionStorage.clear();
  }
  has(key: string) {
    return window.sessionStorage.hasOwnProperty(key);
  }
}

class Cookie {
  set(key: string, value: any, time: number) {
    const date = new Date();
    date.setDate(date.getTime() + time * 1000);
    document.cookie = key + "=" + JSON.parse(value) + ";path=/;expires=" + date;
  }
  get(key: string) {
    const arr = document.cookie.split("; ");
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i].split("=");
      if (a[0] == key) {
        return a[1];
      }
    }
  }
  remove(key: string) {
    this.set(key, "", -1);
  }
  has(key: string): boolean {
    const arr = document.cookie.split("; ");
    for (let i = 0; i < arr.length; i++) {
      const a = arr[i].split("=");
      if (a[0] == key) {
        return true;
      }
    }
    return false;
  }
}

export default {
  local: new LocalStorage(),
  session: new SessionStorage(),
  cookie: new Cookie(),
};
