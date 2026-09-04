// In-memory Firestore contract double. Transactions are serialized and atomic;
// this tests service invariants, not Firestore emulator/runtime behavior.
const clone = (value) => value === undefined ? undefined : structuredClone(value);
const field = (value, path) => path.split(".").reduce((node, key) => node?.[key], value);

export const testFieldValue = {
  serverTimestamp: () => new Date("2026-09-04T00:00:00Z"),
  increment: (amount) => ({ testIncrement: amount }),
};

class Snapshot {
  constructor(ref, record) {
    this.ref = ref;
    this.id = ref.id;
    this.exists = Boolean(record);
    this.value = clone(record?.data);
    this.updateTime = { version: record?.version, isEqual: (other) => other.version === record?.version };
  }
  data() { return clone(this.value); }
}

class Document {
  constructor(db, path) {
    this.db = db;
    this.path = path;
    this.id = path.split("/").at(-1);
  }
  async get() { return new Snapshot(this, this.db.records.get(this.path)); }
  async update(data) { return this.db.apply(this.db.records, "update", this, data); }
  async set(data, options) { return this.db.apply(this.db.records, "set", this, data, options); }
}

class Query {
  constructor(db, path, options = {}) { Object.assign(this, { db, path, ...options }); }
  where(name, operator, value) {
    if (operator !== "==") throw new Error("Unsupported test query");
    return new Query(this.db, this.path, { ...this, filters: [...(this.filters || []), [name, value]] });
  }
  orderBy(name, direction) { return new Query(this.db, this.path, { ...this, order: [name, direction] }); }
  limit(count) { return new Query(this.db, this.path, { ...this, count }); }
  startAfter(snapshot) { return new Query(this.db, this.path, { ...this, cursor: snapshot.id }); }
  doc(id = String(++this.db.nextId).padStart(20, "0")) { return new Document(this.db, `${this.path}/${id}`); }
  async get() {
    let docs = [...this.db.records].filter(([path, record]) => (
      path.slice(0, path.lastIndexOf("/")) === this.path
      && (this.filters || []).every(([name, value]) => field(record.data, name) === value)
      && (!this.order || field(record.data, this.order[0]) !== undefined)
    )).map(([path, record]) => new Snapshot(new Document(this.db, path), record));
    if (this.order) {
      const [name, direction] = this.order;
      docs.sort((a, b) => {
        const av = field(a.data(), name);
        const bv = field(b.data(), name);
        const cmp = av < bv ? -1 : av > bv ? 1 : a.id.localeCompare(b.id);
        return direction === "desc" ? -cmp : cmp;
      });
    }
    if (this.cursor) docs = docs.slice(docs.findIndex((doc) => doc.id === this.cursor) + 1);
    docs = docs.slice(0, this.count ?? docs.length);
    return { docs, size: docs.length, empty: !docs.length };
  }
}

export class TestDb {
  records = new Map();
  nextId = 0;
  queue = Promise.resolve();
  collection(path) { return new Query(this, path); }
  getAll(...refs) { return Promise.all(refs.map((ref) => ref.get())); }
  seed(path, data) { this.apply(this.records, "set", new Document(this, path), data); return this; }
  read(path) { return clone(this.records.get(path)?.data); }
  apply(records, operation, ref, payload, options) {
    const existing = records.get(ref.path);
    if (operation === "create" && existing) throw new Error("Document already exists");
    if (operation === "update" && !existing) throw new Error("Document does not exist");
    if (operation === "delete") { records.delete(ref.path); return; }
    const data = clone(operation === "update" || options?.merge ? existing?.data || {} : {});
    Object.entries(payload).forEach(([path, value]) => {
      const keys = path.split(".");
      const key = keys.pop();
      const target = keys.reduce((node, part) => node[part] ||= {}, data);
      target[key] = value?.testIncrement !== undefined
        ? (target[key] || 0) + value.testIncrement : clone(value);
    });
    records.set(ref.path, { data, version: (existing?.version || 0) + 1 });
  }
  runTransaction(callback) {
    const run = this.queue.then(async () => {
      const writes = [];
      const transaction = {
        get: async (ref) => {
          if (writes.length) throw new Error("Transactions must read before writing");
          return ref.get();
        },
      };
      for (const operation of ["create", "update", "set", "delete"]) {
        transaction[operation] = (...args) => writes.push([operation, ...args]);
      }
      const result = await callback(transaction);
      const draft = new Map(this.records);
      for (const write of writes) this.apply(draft, ...write);
      this.records = draft;
      return result;
    });
    this.queue = run.catch(() => {});
    return run;
  }
}
