"use client";

import {useMemo, useEffect, useState} from "react";
import Link from "next/link";
import {Compass, Feather, Play, Sparkles} from "lucide-react";
import {useApp} from "./provider";
import {TrustBadge} from "./shared";
import {useI18n} from "./i18n";
import {rankPlaces} from "@/lib/planner";

export function Discover(){
 const {catalog,preferences}=useApp();
 const {t,locale}=useI18n();
 const [journalLine, setJournalLine] = useState("Waiting for your thoughts...");

 useEffect(() => {
   const lines = [
     "The stones of Jerusalem are whispering...",
     "Generating a bespoke itinerary based on your spirit.",
     "History is layering itself before your eyes...",
     "Crafting a personalized digital journal for your journey."
   ];
   let i = 0;
   const interval = setInterval(() => {
     setJournalLine(lines[i % lines.length]);
     i++;
   }, 3000);
   return () => clearInterval(interval);
 }, []);

 return <main className="landing" style={{background: 'var(--deep)', color: 'var(--lime)', minHeight: '100vh'}}>
  <section style={{
    position: 'relative',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center',
    padding: '0 5%',
    overflow: 'hidden'
  }}>
    <div style={{
      position: 'absolute',
      inset: 0,
      background: 'url(/images/jerusalem-hero.webp) center/cover',
      opacity: 0.15,
      filter: 'grayscale(100%) contrast(150%)',
      zIndex: 0
    }}/>
    <div style={{position: 'relative', zIndex: 1, maxWidth: '800px'}}>
      <Compass size={48} style={{margin: '0 auto 24px', opacity: 0.8, color: 'var(--orange)'}}/>
      <h1 style={{
        fontSize: 'clamp(3rem, 8vw, 7rem)',
        fontWeight: '300',
        lineHeight: 1,
        marginBottom: '2rem',
        textShadow: '0 4px 12px rgba(0,0,0,0.5)'
      }}>
        The Living <br/><em style={{fontStyle: 'italic', color: 'var(--orange)'}}>Journal</em>
      </h1>
      <p style={{
        fontSize: '1.2rem',
        opacity: 0.8,
        marginBottom: '3rem',
        maxWidth: '600px',
        margin: '0 auto 3rem'
      }}>
        Speak to the guide, and watch your journey dynamically typeset itself into reality. No two visits are the same.
      </p>
      
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px'
      }}>
        <Link href="/guide" style={{
          padding: '1rem 2rem',
          background: 'var(--lime)',
          color: 'var(--deep)',
          border: 'none',
          borderRadius: '50px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '1rem',
          fontWeight: '600',
          transition: 'transform 0.3s'
        }}>
          <Feather size={20}/> Start Journaling
        </Link>
        <Link href="/explore" style={{
          padding: '1rem 2rem',
          background: 'transparent',
          color: 'var(--lime)',
          border: '1px solid var(--lime)',
          borderRadius: '50px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '1rem',
          fontWeight: '600',
          transition: 'transform 0.3s'
        }}>
          Explore the Archive
        </Link>
      </div>
    </div>
    
    <div style={{
      position: 'absolute',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      fontSize: '0.8rem',
      opacity: 0.6,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }}>
      <Sparkles size={14}/> {journalLine}
    </div>
  </section>
 </main>;
}

