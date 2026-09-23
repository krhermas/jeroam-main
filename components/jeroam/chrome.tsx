"use client"; import {usePathname} from "next/navigation"; import {AppProvider} from "./provider"; import {Header,Footer,Notices} from "./shared"; import {LanguageSelector,LocaleProvider,useI18n} from "./i18n"; import {ThemeProvider} from "./theme";
function LocaleGate({children}:{children:React.ReactNode}){const {ready}=useI18n();if(!ready)return <main className="language-gate-loading" aria-live="polite"><span className="spinner"/></main>;return <>{children}</>;}
export function Chrome({children}:{children:React.ReactNode}){
  const path=usePathname();
  const showFooter=/^\/(about|contact|faq|terms|privacy|cookies|credits|sources|report|setup|travel-information)($|\/)/.test(path);
  return <ThemeProvider><LocaleProvider><LocaleGate><AppProvider><Header key={`header-${path}`}/><Notices/><div key={path} className="page-transition">{children}</div>{showFooter&&<Footer/>}</AppProvider></LocaleGate></LocaleProvider></ThemeProvider>;
}

