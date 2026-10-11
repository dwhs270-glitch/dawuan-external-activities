export type Activity={id:string,title:string,organizer:string,date:string,time:string,venue:string,capacity:number,note:string,closed:number,type:string,other_type:string,deadline:string|null};
export type Person={id:string,event_id:string,name:string,diet:string,note:string};
export type Data={events:Activity[],attendees:Person[]};
export const types=["餐會","運動會","校慶","畢業典禮","家長會交接／授證","其他活動"];
export const emptyEvent={type:"餐會",other_type:"",deadline:"",title:"",organizer:"",date:"",time:"18:30",venue:"",capacity:4,note:""};
export function taiwanDate(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function chronological(a:Activity,b:Activity){return (a.date+a.time).localeCompare(b.date+b.time)||a.id.localeCompare(b.id);}
export function remaining(e:Activity,people:Person[]){return Math.max(0,e.capacity-people.filter(p=>p.event_id===e.id).length);}
export function availableActivities(data:Data,today:string){return data.events.filter(e=>e.date>=today&&remaining(e,data.attendees)>0).sort(chronological);}
export function registrationStatus(e:Activity,people:Person[],today:string){if(e.date<today)return '活動已結束';if(e.closed)return '已停止登記';if(e.deadline&&e.deadline<today)return '已截止登記';if(remaining(e,people)===0)return '已額滿';return '';}
export function dateLabel(s:string,short=false){const [y,m,d]=s.split('-').map(Number);const day='日一二三四五六'[new Date(s+'T12:00:00+08:00').getDay()];return short?`${m}/${d}（${day}）`:`${y-1911}年${m}月${d}日（${day}）`;}
