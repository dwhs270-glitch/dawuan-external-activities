import {GET,POST} from './data.ts';
export async function cleanup(db:any){
 const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
 const r=await db.batch([db.prepare('DELETE FROM attendees WHERE event_id IN (SELECT id FROM events WHERE date < ?)').bind(today),db.prepare('DELETE FROM events WHERE date < ?').bind(today)]);
 return {ok:true,today,deletedAttendees:r[0].meta.changes,deletedEvents:r[1].meta.changes};
}
export default {
 async fetch(req:Request,env:any){
  const origin=req.headers.get('origin');const allowed=env.ALLOWED_ORIGIN;
  if(!allowed)return Response.json({error:'後端尚未設定允許的網站來源'},{status:503});
  if(origin&&origin!==allowed)return Response.json({error:'無效的請求'},{status:403});
  let r:Response;const path=new URL(req.url).pathname;
  if(req.method==='OPTIONS')r=new Response(null,{status:204});
  else if(path==='/api/data'&&req.method==='GET')r=await GET(env.DB);
  else if(path==='/api/data'&&req.method==='POST')r=await POST(req,env.DB,allowed);
  else if(path==='/api/cleanup'&&req.method==='POST'){
   if(!env.CLEANUP_SECRET||req.headers.get('authorization')!=='Bearer '+env.CLEANUP_SECRET)r=Response.json({error:'未授權'},{status:401});
   else {try{r=Response.json(await cleanup(env.DB));}catch{r=Response.json({error:'過期活動清理失敗'},{status:503});}}
  }else r=Response.json({error:'找不到服務'},{status:404});
  const h=new Headers(r.headers);h.set('Access-Control-Allow-Origin',allowed);h.set('Access-Control-Allow-Methods','GET,POST,OPTIONS');h.set('Access-Control-Allow-Headers','Content-Type,Authorization');h.set('Vary','Origin');h.set('Cache-Control','no-store');
  return new Response(r.body,{status:r.status,headers:h});
 },
 async scheduled(_event:any,env:any,ctx:any){ctx.waitUntil(cleanup(env.DB));}
};
