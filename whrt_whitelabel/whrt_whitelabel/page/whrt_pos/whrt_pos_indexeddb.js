// whrt_pos_indexeddb.js
export let db = null;

export async function initIDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open("whrt_pos_db", 1);
    request.onupgradeneeded = function (event) {
      db = event.target.result;
      if (!db.objectStoreNames.contains("storage")) {
        db.createObjectStore("storage", { keyPath: "key" });
      }
    };
    request.onsuccess = function (event) {
      db = event.target.result;
      resolve();
    };
    request.onerror = function (event) {
      console.error("IndexedDB error:", event.target.errorCode);
      reject(event.target.errorCode);
    };
  });
}

export async function getStorage(key) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(["storage"], "readonly");
    let store = transaction.objectStore("storage");
    let request = store.get(key);
    request.onsuccess = function () {
      resolve(request.result ? request.result.value : null);
    };
    request.onerror = function () {
      reject(request.error);
    };
  });
}

export async function setStorage(key, value) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(["storage"], "readwrite");
    let store = transaction.objectStore("storage");
    let request = store.put({ key: key, value: value });
    request.onsuccess = function () { resolve(); };
    request.onerror = function () { reject(request.error); };
  });
}

export async function removeStorage(key) {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(["storage"], "readwrite");
    let store = transaction.objectStore("storage");
    let request = store.delete(key);
    request.onsuccess = function () { resolve(); };
    request.onerror = function () { reject(request.error); };
  });
}

export async function clearStorage() {
  return new Promise((resolve, reject) => {
    let transaction = db.transaction(["storage"], "readwrite");
    let store = transaction.objectStore("storage");
    let request = store.clear();
    request.onsuccess = function () { resolve(); };
    request.onerror = function () { reject(request.error); };
  });
}
