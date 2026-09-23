import type {AIAvailability,AIRequest,AIResponse} from "./types";

export class AIServiceError extends Error{
 constructor(message:string,public code="AI_REQUEST_FAILED",public status=500){super(message);}
}

async function readJSON(response:Response){
 try{return await response.json() as Record<string,unknown>;}catch{return {};}
}

function timeoutSignal(parent:AbortSignal|undefined,timeoutMs:number){
 const controller=new AbortController();
 let timedOut=false;
 const onAbort=()=>controller.abort();
 if(parent?.aborted)controller.abort();
 else parent?.addEventListener("abort",onAbort,{once:true});
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},timeoutMs);
 return {signal:controller.signal,timedOut:()=>timedOut,cleanup:()=>{clearTimeout(timer);parent?.removeEventListener("abort",onAbort);}};
}

export async function getAIAvailability(signal?:AbortSignal):Promise<AIAvailability>{
 const request=timeoutSignal(signal,8000);
 try{
  const response=await fetch("/api/ai",{method:"GET",headers:{Accept:"application/json"},signal:request.signal,cache:"no-store"});
  const body=await readJSON(response);
  if(!response.ok)throw new AIServiceError(typeof body.error==="string"?body.error:"AI availability could not be checked.","AI_STATUS_FAILED",response.status);
  return body as unknown as AIAvailability;
 }catch(error){
  if(request.timedOut())throw new AIServiceError("The AI availability check timed out. Try again.","AI_TIMEOUT",408);
  throw error;
 }finally{request.cleanup();}
}

export async function requestAI(request:AIRequest,signal?:AbortSignal):Promise<AIResponse>{
 const requestSignal=timeoutSignal(signal,30000);
 try{
  const response=await fetch("/api/ai",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json"},body:JSON.stringify(request),signal:requestSignal.signal});
  const body=await readJSON(response);
  if(!response.ok)throw new AIServiceError(typeof body.error==="string"?body.error:"The AI provider did not return a response.",typeof body.code==="string"?body.code:"AI_REQUEST_FAILED",response.status);
  return body as unknown as AIResponse;
 }catch(error){
  if(requestSignal.timedOut())throw new AIServiceError("The AI provider took too long to respond. Try again.","AI_TIMEOUT",408);
  throw error;
 }finally{requestSignal.cleanup();}
}
