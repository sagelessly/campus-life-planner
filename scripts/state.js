let records =[];
const listeners = new Set();

function emit(){
    const snapshot = getAll();
    listeners.forEach((fn) => fn (snapshot));
}

export function init(initial){
    records =initial.slice();
}
export function getAll(){
    return records.slice();
}
export function get(id){
    return records.find((r) => r.id === id) || null;
}
export function subscribe(fn){
    listeners.add(fn);
    return () => listeners.delete(fn);
}

function nextId() {
    const max = records.reduce((m, r) => {
      const n = /^rec_(\d+)$/.exec(r.id);
      return n ? Math.max(m, Number(n[1])) : m;
    }, 0);
    return `rec_${String(max + 1).padStart(4, '0')}`;
  }

export function add(fields){
    const now = new Date().toISOString();
    const record ={
        id: nextId(),
        type: fields.type,
        title: fields.title,
        dueDate: fields.dueDate,
        duration: Number(fields.duration),
        tag: fields.tag,
        createdAt: now,
        updatedAt: now,    
    };
    records.push(record);
    emit();
    return record;
}

export function update (id, fields){
    const i = records.findIndex((r) => r.id ===id);
    if(i=== -1) return null;
    records[i] = {
        ...records[i],
        type: fields.type,
        title: fields.title, 
        dueDate: fields.dueDate,
        duration: Number(fields.duration),
        tag: fields.tag, 
        updateAt: new Date().toISOString(),
    };
    emit();
    return records[i];
}

export function remove(id){
    const before = records.length;
    records = records.filter((r) => r.id !== id);
    if (records.length !== before) emit ();
}

export function replaceAll(list){
    records = list.slice();
    emit();
}
  