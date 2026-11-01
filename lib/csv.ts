/** Small RFC4180-compatible CSV parser supporting comma, semicolon and tabs. */
export function parseCsv(text: string): string[][] {
  const source=text.replace(/^\uFEFF/,'')
  const delimiter=detectDelimiter(source)
  const rows:string[][]=[]
  let row:string[]=[],value='',quoted=false
  for (let i=0;i<source.length;i++) {
    const c=source[i]
    if(c==='"') {
      if(quoted && source[i+1]==='"') {value+='"';i++}
      else if(quoted) quoted=false
      else if(!value) quoted=true
      else value+=c
    } else if (c===delimiter && !quoted) {row.push(value);value=''}
    else if((c==='\r'||c==='\n') && !quoted) {
      row.push(value);if(row.some(v=>v.trim())) rows.push(row)
      row=[];value='';if(c==='\r'&&source[i+1]==='\n')i++
    } else value+=c
  }
  if(quoted) throw new Error('Aspas de CSV não fechadas.')
  row.push(value);if(row.some(v=>v.trim()))rows.push(row)
  return rows
}
function detectDelimiter(source: string): string {
  let first='',quoted=false
  for(let i=0;i<source.length;i++) {
    const c=source[i]
    if(c==='"') {if(quoted&&source[i+1]==='"') {i++;continue}quoted=!quoted}
    if(!quoted&&(c==='\r'||c==='\n'))break
    first+=c
  }
  const choices=[',',';','\t']
  let best=',',count=0
  for(const c of choices){const n=first.split(c).length-1;if(n>count){count=n;best=c}}
  return best
}
