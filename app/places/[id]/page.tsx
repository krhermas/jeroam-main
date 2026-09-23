import {notFound} from "next/navigation";
import {PlaceDetail} from "@/components/jeroam/details";
import {releaseCatalog} from "@/lib/catalog";

export default async function PlacePage({params}:{params:Promise<{id:string}>}){
 const id=(await params).id;
 if(!releaseCatalog.places.some(place=>place.id===id))notFound();
 return <PlaceDetail id={id}/>;
}
