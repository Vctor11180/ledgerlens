import { useEffect, useRef, useState } from "react"
import { Bot, Fingerprint, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import type { AnalysisResult } from "@/lib/analysis.types"
import { DecryptText } from "@/components/ui/DecryptText"

interface IdentityBadgeProps {
  result: AnalysisResult
  address: string
}

export function IdentityBadge({ result, address }: IdentityBadgeProps) {
  const isBot = result.identity.toLowerCase().includes("bot")
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const avatarRef = useRef<HTMLDivElement>(null)
  
  const riskColor =
    result.risk_score >= 70
      ? "text-red-400"
      : result.risk_score >= 40
        ? "text-yellow-400"
        : "text-emerald-400"

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!avatarRef.current) return
      const rect = avatarRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      
      const deltaX = (e.clientX - centerX) / 15
      const deltaY = (e.clientY - centerY) / 15
      
      const limit = 3
      setMousePos({ 
        x: Math.max(-limit, Math.min(limit, deltaX)), 
        y: Math.max(-limit, Math.min(limit, deltaY)) 
      })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-8 transition-all duration-700 bg-card",
        isBot
          ? "border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.1)]"
          : "border-accent/30 shadow-[0_0_40px_rgba(16,185,129,0.1)]"
      )}
    >
      {/* Background Fingerprint Scan Layer */}
      <div className="absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <Fingerprint className="h-48 w-48 text-foreground animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-1 bg-foreground/20 animate-[scanline_3s_linear_infinite]" />
      </div>

      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
        {/* Interactive Avatar Wrapper */}
        <div 
          ref={avatarRef}
          className="relative group shrink-0"
        >
          {/* Orbital Ring Logo */}
          <div className="absolute inset-0 -m-4 rounded-full border border-white/5 animate-spin-slow-very" />
          <div className="absolute inset-0 -m-4 border-t border-white/20 rounded-full animate-spin-slow-very" />
          
          <div className={cn(
            "flex h-24 w-24 items-center justify-center rounded-full bg-muted ring-1 ring-border overflow-hidden",
            isBot ? "shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          )}>
            {isBot ? (
              <Bot className="h-12 w-12 text-red-400" />
            ) : (
              /* Custom Human Icon with Eye Tracking */
              <div className="relative flex flex-col items-center">
                <div className="flex gap-2.5 mb-1.5 mt-2">
                   {/* Left Eye */}
                   <div className="h-2 w-2 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      <div 
                        className="h-1 w-1 rounded-full bg-emerald-400" 
                        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
                      />
                   </div>
                   {/* Right Eye */}
                   <div className="h-2 w-2 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                      <div 
                        className="h-1 w-1 rounded-full bg-emerald-400" 
                        style={{ transform: `translate(${mousePos.x}px, ${mousePos.y}px)` }}
                      />
                   </div>
                </div>
                {/* Body Shape */}
                <div className="h-10 w-12 rounded-t-2xl bg-gradient-to-b from-white/20 to-transparent" />
              </div>
            )}
            
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />
          </div>
          
          {/* Status Indicator */}
          <div className={cn(
            "absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-black",
            isBot ? "bg-red-500" : "bg-emerald-500"
          )} />
        </div>

        <div className="min-w-0 flex-1 space-y-6 w-full text-center md:text-left">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
              <h2 className="text-3xl font-black text-foreground tracking-widest uppercase font-display italic">
                <DecryptText text={result.identity} />
              </h2>
              <div
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-1 text-[10px] font-black uppercase tracking-widest",
                  isBot
                    ? "border-red-500/30 bg-red-500/10 text-red-400"
                    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                )}
              >
                {isBot ? <Zap className="h-3 w-3" /> : <Fingerprint className="h-3 w-3" />}
                {isBot ? "Neural Bot Engine" : "Verified Humanoid"}
              </div>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              PRISMA_DATABASE_SEQUENCE_{result.chain?.slice(0, 3)}_{address?.slice(2, 8)}
            </p>
          </div>

          {/* Scanned Risk Score */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] uppercase font-black tracking-widest text-slate-400">
              <span>Risk Probability Index</span>
              <span className={cn("text-lg", riskColor)}>{result.risk_score}%</span>
            </div>
            <div className="h-1.5 w-full bg-muted overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-1000 ease-out",
                  result.risk_score >= 70 ? "bg-red-500" : result.risk_score >= 40 ? "bg-yellow-500" : "bg-emerald-500"
                )}
                style={{ width: `${result.risk_score}%` }}
              />
            </div>
          </div>

          <div className="relative rounded-lg border border-border bg-muted/20 p-5 shadow-inner">
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <p className="text-xs leading-relaxed text-slate-400 italic font-medium">
              <span className="mb-2 block text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">
                Neural Inference Narrative:
              </span>
              <DecryptText text={result.narrative} speed={25} delay={400} />
            </p>
          </div>
          
          <div className="flex items-center gap-6 pt-2 opacity-40">
             <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-slate-800" />
                <span className="text-[8px] font-mono text-slate-600">SECURE_CHANNEL</span>
             </div>
             <div className="flex items-center gap-2">
                <div className="h-1 w-8 bg-slate-800" />
                <span className="text-[8px] font-mono text-slate-600">EVM_TRACE_COMPLETE</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
