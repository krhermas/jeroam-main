import {UpdateDetail} from "@/components/jeroam/updates";

export default async function UpdateDetails({params}:{params:Promise<{id:string}>}){return <UpdateDetail id={(await params).id}/>;}
