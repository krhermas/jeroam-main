type WindowEntry={count:number;resetAt:number};

// A small in-process guard for the integration-ready endpoint. Production
// deployments should replace this with an edge/Redis limiter, but keeping the
// contract here prevents an accidental unbounded provider bill while the app
// is running locally or on a single worker.
const windows=new Map<string,WindowEntry>();
const WINDOW_MS=60_000;
const MAX_REQUESTS=12;

export function allowAIRequest(key:string,now=Date.now()){
 const current=windows.get(key);
 if(!current||current.resetAt<=now){
  windows.set(key,{count:1,resetAt:now+WINDOW_MS});
  return {allowed:true,retryAfter:0};
 }
 if(current.count>=MAX_REQUESTS)return {allowed:false,retryAfter:Math.max(1,Math.ceil((current.resetAt-now)/1000))};
 current.count+=1;
 return {allowed:true,retryAfter:0};
}

export const aiRateLimit={windowMs:WINDOW_MS,maxRequests:MAX_REQUESTS};
