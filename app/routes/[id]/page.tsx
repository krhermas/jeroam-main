import {notFound} from "next/navigation";
import {RouteDetail} from "@/components/jeroam/details";
import {releaseCatalog} from "@/lib/catalog";

export default async function RoutePage({params}:{params:Promise<{id:string}>}){
 const id=(await params).id;
 if(!releaseCatalog.routes.some(route=>route.id===id))notFound();
 return <RouteDetail id={id}/>;
}
