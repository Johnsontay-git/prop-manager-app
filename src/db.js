const DB_NAME = 'PropManagerDB';
const DB_VERSION = 1;
let db;

export function openDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db);
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      const stores = [
        { name: 'properties', indexes: [] },
        { name: 'units',      indexes: ['property_id'] },
        { name: 'tenants',    indexes: ['unit_id', 'property_id'] },
        { name: 'rentals',    indexes: ['tenant_id', 'property_id', 'status'] },
        { name: 'jobs',       indexes: ['property_id', 'status'] },
      ];
      stores.forEach(({ name, indexes }) => {
        if (d.objectStoreNames.contains(name)) return;
        const s = d.createObjectStore(name, { keyPath: 'id', autoIncrement: true });
        indexes.forEach(idx => s.createIndex(idx, idx));
      });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror  = e => reject(e.target.error);
  });
}

function op(store, mode, fn) {
  return openDB().then(d => new Promise((res, rej) => {
    const s = d.transaction(store, mode).objectStore(store);
    const req = fn(s);
    req.onsuccess = e => res(e.target.result);
    req.onerror   = e => rej(e.target.error);
  }));
}

export const getAll    = store       => op(store, 'readonly',  s => s.getAll());
export const getById   = (store, id) => op(store, 'readonly',  s => s.get(id));
export const getByIdx  = (store, idx, val) => openDB().then(d => new Promise((res, rej) => {
  const req = d.transaction(store,'readonly').objectStore(store).index(idx).getAll(val);
  req.onsuccess = e => res(e.target.result);
  req.onerror   = e => rej(e.target.error);
}));
export const addRecord = (store, data) => op(store, 'readwrite', s => s.add(data));
export const putRecord = (store, data) => op(store, 'readwrite', s => s.put(data));
export const delRecord = (store, id)   => op(store, 'readwrite', s => s.delete(id));
