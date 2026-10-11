const TYPES=["餐會","運動會","校慶","畢業典禮","家長會交接／授證","其他活動"];
const DIETS=["葷食","素食","未註記"];
function fail(error:string,status=400){return Response.json({error},{status});}
function today(){return new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Taipei",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());}
function validDate(s:any){if(typeof s!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(s))return false;let d=new Date(s+"T12:00:00Z");return !isNaN(d.getTime())&&d.toISOString().slice(0,10)===s;}
export async function GET(db:any){try{return Response.json({events:(await db.prepare('SELECT * FROM events ORDER BY date,time,id').all()).results,attendees:(await db.prepare('SELECT * FROM attendees ORDER BY rowid').all()).results},{headers:{"Cache-Control":"no-store"}});}catch(e){console.error(e);return fail("名單暫時無法載入，請稍後重新整理。",503);}}
export async function POST(req:Request,db:any,allowedOrigin:string){try{
const origin=req.headers.get("origin");if(origin&&origin!==allowedOrigin)return fail("無效的請求",403);
const b:any=await req.json();
if(b.action==="event"){
 const e=b.event; if(!e||!e.title?.trim()||!e.organizer?.trim()||!e.venue?.trim()||!TYPES.includes(e.type)||!validDate(e.date)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(e.time)||!Number.isInteger(+e.capacity)||+e.capacity<1||+e.capacity>100)return fail("請完整填寫活動資訊，名額須為1～100人。");
 if(e.type==="其他活動"&&!e.other_type?.trim())return fail("請輸入其他活動類型。");
 if(e.deadline&&(!validDate(e.deadline)||e.deadline>e.date))return fail("報名截止日期須為有效日期，且不得晚於活動日期。");
 const id=crypto.randomUUID();await db.prepare("INSERT INTO events (id,title,organizer,date,time,venue,capacity,note,closed,type,other_type,deadline) VALUES (?,?,?,?,?,?,?,?,0,?,?,?)").bind(id,e.title.trim().slice(0,150),e.organizer.trim().slice(0,100),e.date,e.time,e.venue.trim().slice(0,200),+e.capacity,String(e.note||"").slice(0,500),e.type,e.type==="其他活動"?e.other_type.trim().slice(0,60):"",e.deadline||null).run();return Response.json({ok:true,id});
}
else if(b.action==="signup"){
 const name=String(b.name||"").trim();const diet=b.diet||"未註記";
 if(!name||name.length>40||!DIETS.includes(diet))return fail("請填寫姓名，姓名限40字以內。");
 const id=crypto.randomUUID();const r=await db.prepare("INSERT OR IGNORE INTO attendees (id,event_id,name,diet,note) SELECT ?,id,?,?,? FROM events WHERE id=? AND closed=0 AND (deadline IS NULL OR deadline>=?) AND (SELECT COUNT(*) FROM attendees WHERE event_id=events.id)<capacity").bind(id,name,diet,String(b.note||"").slice(0,200),b.eventId,today()).run();
 if(!r.meta.changes)return fail("此姓名已登記，或活動已額滿／截止／停止報名。請重新整理確認。",409);return Response.json({ok:true,id});
}
else if(b.action==="edit-person"){
 const name=String(b.name||"").trim();const diet=b.diet||"未註記";
 if(!name||name.length>40||!DIETS.includes(diet))return fail("請填寫姓名，姓名限40字以內。");
 const person=await db.prepare("SELECT event_id FROM attendees WHERE id=?").bind(b.id).first<{event_id:string}>();if(!person)return fail("此筆登記已不存在，請重新整理。",404);
 if(await db.prepare("SELECT id FROM attendees WHERE event_id=? AND name=? AND id<>?").bind(person.event_id,name,b.id).first())return fail("此活動已有相同姓名，請確認登記人員。",409);
 const r=await db.prepare("UPDATE OR IGNORE attendees SET name=?,diet=?,note=? WHERE id=?").bind(name,diet,String(b.note||"").slice(0,200),b.id).run();if(!r.meta.changes)return fail("修改未完成，請重新整理確認是否有重複姓名。",409);
}
else if(b.action==="delete-event"){
 if(!await db.prepare("SELECT id FROM events WHERE id=?").bind(b.id).first())return fail("此活動已不存在，請重新整理。",404);
 await db.batch([db.prepare("DELETE FROM attendees WHERE event_id=?").bind(b.id),db.prepare("DELETE FROM events WHERE id=?").bind(b.id)]);
}
else if(b.action==="delete-person"){
 const r=await db.prepare("DELETE FROM attendees WHERE id=?").bind(b.id).run();if(!r.meta.changes)return fail("此筆登記已不存在，請重新整理。",404);
}
else if(b.action==="diet"){
 if(!DIETS.includes(b.diet))return fail("飲食選項有誤");await db.prepare("UPDATE attendees SET diet=? WHERE id=?").bind(b.diet,b.id).run();
}
else return fail("不支援的操作");
return Response.json({ok:true});
}catch(e){console.error(e);return fail("儲存失敗，請保留填寫內容並稍後再試。",503);}}
