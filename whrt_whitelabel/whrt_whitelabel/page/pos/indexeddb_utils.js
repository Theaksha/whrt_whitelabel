// === indexeddb_utils.js ===
export const POS_DB_NAME = 'whrt_pos_db';
export const POS_DB_VERSION = 1;
export const STORE_NAMES = ['items', 'item_groups', 'customers'];

export async function openPOSDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(POS_DB_NAME, POS_DB_VERSION);

    request.onupgradeneeded = function (event) {
      const db = event.target.result;
      STORE_NAMES.forEach(store => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'name' });
        }
      });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveToIndexedDB(storeName, dataList) {
  try {
    const db = await openPOSDB();
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.clear();
    dataList.forEach(item => store.put(item));
    await tx.complete;
    db.close();
  } catch (error) {
    console.error(`Failed to save to ${storeName}`, error);
  }
}

export async function getAllFromIndexedDB(storeName) {
  try {
    const db = await openPOSDB();
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        db.close();
        resolve(request.result || []);
      };
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Failed to fetch from ${storeName}`, error);
    return [];
  }
}
