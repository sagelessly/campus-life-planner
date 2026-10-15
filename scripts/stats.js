const round2 = (n) => Math.round(n*100)/100;

export function localToday(){
    const d = new Date();
    const pad = (n) => String(n).padStart(2,'0');
    return `${d.getFullYear()} - ${pad(d.getMonth()+1)} - ${pad(d.getDate())}`;
}

export function addDays(iso, n){
    const [y, m, d]= iso.split('-').map(Number);
    return new Date(Date.UTC(y,m-1,d+n)).toISOString().slice(0,10);
}

export function formatMinutes(minutes, unit){
    return unit === 'hr' ? `${round2(minutes / 60)} h`: `${round2(minutes)} min`;
}

export const toUnit = (minutes, unit) => (unit === 'hr' ? minutes / 60 : minutes);
export const fromUnit = (value, unit) => (unit === 'hr' ? value * 60 : value);

export function computeStats(records, today) {
    const total = records.length;
    const totalMinutes = records.reduce((sum, r) => sum + r.duration, 0);
  
    const counts = new Map();
    for (const r of records) {
      const key = r.tag.toLowerCase();
      const entry = counts.get(key) || { tag: r.tag, n: 0 };
      entry.n += 1;
      counts.set(key, entry);
    }
    let top = null;
    for (const entry of counts.values()) {
      if (!top || entry.n > top.n || (entry.n === top.n && entry.tag.localeCompare(top.tag) < 0)) top = entry;
    }
  
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const date = addDays(today, -i);
      const day = records.filter((r) => r.dueDate === date);
      trend.push({
        date,
        label: new Date(date + 'T00:00:00Z').toLocaleDateString('en-GB', {
          weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC',
        }),
        count: day.length,
        minutes: day.reduce((s, r) => s + r.duration, 0),
      });
    }

    return{
        total,
        totalMinutes,
        topTag: top ? top.tag : null,
        topTagCount: top ? top.n : 0,
        trend,
    };
}

export function targetStatus(totalMinutes, targetMinutes) {
    if (!(targetMinutes > 0)) return { state: 'none', remaining: 0, overage: 0 };
    if (totalMinutes > targetMinutes) {
      return { state: 'over', remaining: 0, overage: round2(totalMinutes - targetMinutes) };
    }
    return { state: 'under', remaining: round2(targetMinutes - totalMinutes), overage: 0 };
  }