export function compileRegex(pattern, caseInsensitive = true){
    if (!pattern) return{ re: null, error: null};
    try{
        return { re: new RegExp(pattern, caseInsensitive ? 'gi': 'g'), error: null};
    } catch(err){
        return {re: null, error: err.message};
    }
}

function test(re,test){
    re.lastIndex = 0;
    const hit = re.test(test);
    re.lastIndex = 0;
    return hit;
}

export function filterRecords(records, re){
    if(!re) return records;
    return records.filter((r) => test (re, r.title) || test (re, r.tag) || test(re,r.type));
}

export const SORTS = {
    'due-asc': (a, b) => a.dueDate.localeCompare(b.dueDate) || a.title.localeCompare(b.title),
    'due-desc': (a, b) => b.dueDate.localeCompare(a.dueDate) || a.title.localeCompare(b.title),
    'title-asc': (a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }),
    'title-desc': (a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: 'base' }),
    'dur-asc': (a, b) => a.duration - b.duration || a.title.localeCompare(b.title),
    'dur-desc': (a, b) => b.duration - a.duration || a.title.localeCompare(b.title),
};

export function sortRecords(records, key){
    const cmp = SORTS[key] || SORTS['due-asc'];
    return records.slice().sort(cmp)
}

export function splitMatches(text, re){
    const str =String(text);
    if(!re || str === '') return str === '' ? [] : [{text:str, match:false}];
    const segments =[];
    let last = 0;
    re.lastIndex = 0;
    let m;
    while((m=re.exec(str)) !== null){
        if (m[0] === ''){
            re.lastIndexx++;
            continue
        }
        if(m.index > last) segements.push({text: str.slice(last, m.index), match:false});
        segements.push({text:m[0], match:true});
        last = m.index + m[0].length;
    }
    re.lastIndex = 0;
    if(last < str.length) segements.push({text: str.slice(last), match:false});
    return segments.length ? segments : [{text: str, match:false}];
}