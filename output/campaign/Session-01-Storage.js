/* Campaign records; multi-record imports use one IndexedDB transaction. */
(() => {
  'use strict';
  function create(name, options = {}) {
    const local = options.localStorage || globalThis.localStorage;
    let databasePromise = null;
    function openDatabase() {
      if (options.openDatabase) return options.openDatabase();
      if (databasePromise) return databasePromise;
      databasePromise = new Promise(resolve => {
        if (!globalThis.indexedDB) { resolve(null); return; }
        const timeout = setTimeout(() => resolve(null), 3000);
        try {
          const request = indexedDB.open(name, 1);
          request.onupgradeneeded = () => {
            if (!request.result.objectStoreNames.contains('records')) request.result.createObjectStore('records');
          };
          request.onsuccess = () => { clearTimeout(timeout); resolve(request.result); };
          request.onerror = () => { clearTimeout(timeout); resolve(null); };
          request.onblocked = () => { clearTimeout(timeout); resolve(null); };
        } catch { clearTimeout(timeout); resolve(null); }
      });
      return databasePromise;
    }
    async function readRecord(key) {
      try { if (local.getItem(`${name}:fallback:${key}`) === '1') return local.getItem(`${name}:${key}`); } catch {}
      const db = await openDatabase();
      if (db) try {
        const value = await new Promise((resolve, reject) => {
          const request = db.transaction('records', 'readonly').objectStore('records').get(key);
          request.onsuccess = () => resolve(request.result ?? null);
          request.onerror = () => reject(request.error);
        });
        if (value !== null) return value;
      } catch { /* Fall back to local browser storage. */ }
      try { return local.getItem(`${name}:${key}`); }
      catch { return null; }
    }
    async function writeRecord(key, value) {
      const db = await openDatabase();
      if (db) try {
        await new Promise((resolve, reject) => {
          const transaction = db.transaction('records', 'readwrite');
          transaction.objectStore('records').put(value, key);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
          transaction.onabort = () => reject(transaction.error);
        });
        try { local.removeItem(`${name}:fallback:${key}`); local.removeItem(`${name}:${key}`); } catch {}
        return;
      } catch { /* Fall back to local browser storage. */ }
      local.setItem(`${name}:${key}`, value);
      local.setItem(`${name}:fallback:${key}`, '1');
    }
    async function writeRecordsAtomic(entries) {
      const db = await openDatabase();
      if (!db) throw Error('Safe import needs browser database storage. Download a backup and reopen the desktop app before trying again.');
      for (const [key] of entries) if (local.getItem(`${name}:fallback:${key}`) === '1')
        throw Error('This campaign is using emergency storage. Download a backup before a multi-record import.');
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('records', 'readwrite'), store = transaction.objectStore('records');
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error || Error('Storage transaction failed.'));
        transaction.onabort = () => reject(transaction.error || Error('Storage transaction was interrupted.'));
        try { for (const [key, value] of entries) store.put(value, key); }
        catch (error) { transaction.abort(); reject(error); }
      });
    }
    async function writeMediaRecord(id, blob) {
      if (!(blob instanceof Blob)) throw Error('Media must be a file.');
      const db = await openDatabase();
      if (!db) throw Error('Imported media needs browser database storage.');
      await new Promise((resolve, reject) => {
        const transaction = db.transaction('records', 'readwrite');
        transaction.objectStore('records').put(blob, `media:${id}`);
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });
    }
    async function deleteRecord(key) {
      const db = await openDatabase();
      if (db) try {
        await new Promise((resolve, reject) => {
          const transaction = db.transaction('records', 'readwrite');
          transaction.objectStore('records').delete(key);
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        });
      } catch { /* The record can still be removed from the campaign list. */ }
      try { local.removeItem(`${name}:${key}`); local.removeItem(`${name}:fallback:${key}`); } catch {}
    }
    return { readRecord, writeRecord, writeRecordsAtomic, writeMediaRecord, deleteRecord };
  }
  globalThis.ECHO_STORAGE = { create };
})();
