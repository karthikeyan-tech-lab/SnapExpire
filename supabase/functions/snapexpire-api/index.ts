import { createClient } from "npm:@supabase/supabase-js@2";
const url=Deno.env.get("SUPABASE_URL")!;
const key=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const db=createClient(url,key);
const bucket="snapexpire-photos";
const headers={"Access-Control-Allow-Origin":"https://snapexpire.vercel.app","Access-Control-Allow-Methods":"GET,POST,OPTIONS","Access-Control-Allow-Headers":"content-type","Cache-Control":"no-store"};
function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...headers,"Content-Type":"application/json"}})}
function token(){return Array.from(crypto.getRandomValues(new Uint8Array(32)),x=>x.toString(16).padStart(2,"0")).join("")}
async function hash(s:string){return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s))),x=>x.toString(16).padStart(2,"0")).join("")}
const types:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"};
const validId=(s:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
const validToken=(s:string)=>/^[0-9a-f]{64}$/i.test(s);
Deno.serve(async req=>{
if(req.method==="OPTIONS")return new Response(null,{headers});
const origin=req.headers.get("origin");if(origin&&origin!=="https://snapexpire.vercel.app")return json({error:"Origin not allowed"},403);
try{
const u=new URL(req.url),action=u.searchParams.get("action");
if(action==="upload"&&req.method==="POST"){
const form=await req.formData(),file=form.get("photo");
if(!(file instanceof File)||!types[file.type]||file.size===0||file.size>5*1024*1024)return json({error:"Invalid photo"},400);
if(String(form.get("duration"))!=="5")return json({error:"Only View Once supported"},400);
const id=crypto.randomUUID(),receiver=token(),sender=token(),path=id+"."+types[file.type],expires=new Date(Date.now()+600000).toISOString();
const uploaded=await db.storage.from(bucket).upload(path,file,{contentType:file.type,upsert:false});
if(uploaded.error)throw uploaded.error;
const inserted=await db.from("shared_photos").insert({id,storage_path:path,expires_at:expires,view_once:true,receiver_hash:await hash(receiver),sender_hash:await hash(sender)});
if(inserted.error){await db.storage.from(bucket).remove([path]);throw inserted.error}
return json({id,receiverToken:receiver,senderToken:sender,expiresAt:expires});
}
if(action==="view"&&req.method==="GET"){
const id=u.searchParams.get("id")||"",receiver=u.searchParams.get("token")||"";
if(!validId(id)||!validToken(receiver))return json({error:"Invalid link"},400);
const receiverHash=await hash(receiver);
const {data:record,error}=await db.from("shared_photos").select("storage_path,view_once,expires_at,receiver_hash,status").eq("id",id).eq("receiver_hash",receiverHash).maybeSingle();
if(error)throw error;
if(!record||Date.parse(record.expires_at)<=Date.now())return json({error:"Photo unavailable or expired"},410);
if(!record.view_once)return json({error:"Unsupported photo mode"},410);
const claim=await db.rpc("claim_snapexpire_photo",{p_id:id,p_receiver_hash:receiverHash});
if(claim.error)throw claim.error;
if(!claim.data?.length)return json({error:"Already opened"},410);
const path=claim.data[0].storage_path;
const download=await db.storage.from(bucket).download(path);
if(download.error||!download.data)return json({error:"Photo unavailable"},410);
// The one-time claim is already consumed. Delete cloud source before delivering bytes.
// If deletion fails, fail closed and report the error, allowing later cleanup.
const removed=await db.storage.from(bucket).remove([path]);
if(removed.error)throw removed.error;
const updated=await db.from("shared_photos").update({storage_deleted_at:new Date().toISOString()}).eq("id",id);
if(updated.error)console.error("Storage deleted, metadata update failed",updated.error);
return new Response(download.data,{headers:{...headers,"Content-Type":download.data.type||"image/jpeg","Content-Disposition":"inline","X-Content-Type-Options":"nosniff"}});
}
if(action==="status"&&req.method==="GET"){
const id=u.searchParams.get("id")||"",sender=u.searchParams.get("token")||"";
if(!validId(id)||!validToken(sender))return json({error:"Invalid tracking link"},400);
const {data,error}=await db.from("shared_photos").select("created_at,expires_at,opened_at,viewed_at,closed_at,status,storage_deleted_at").eq("id",id).eq("sender_hash",await hash(sender)).maybeSingle();
if(error)throw error;if(!data)return json({error:"Not found"},404);
return json({...data,expired:Date.parse(data.expires_at)<=Date.now()});
}
return json({error:"Unknown action"},404);
}catch(e){console.error(e);return json({error:"Request failed"},500)}
});
