import { useEffect, useRef, useState } from "react"
import { Terminal, Cpu, Database } from "lucide-react"
import type { AnalysisResult } from "@/lib/analysis.types"
import { DecryptText } from "@/components/ui/DecryptText"

interface AiNarrativeTerminalProps {
  result: AnalysisResult
  address: string
}

export function AiNarrativeTerminal({ result, address }: AiNarrativeTerminalProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [index, setIndex] = useState(0)
  const fullText = result.narrative || "No neural data logs available for this sequence."
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (index < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + fullText[index])
        setIndex((i) => i + 1)
      }, 15)
      return () => clearTimeout(timeout)
    }
  }, [index, fullText])

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [displayedText])

  return (
    <div className="flex h-full min-h-[400px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl backdrop-blur-xl transition-all hover:border-accent/20">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-accent" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            Neural Log Sequence: PRISMA_V1
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-3 w-3 text-slate-500" />
            <span className="text-[9px] font-bold text-slate-500 uppercase">Procesando...</span>
          </div>
          <div className="flex gap-1.5">
            <div className="h-2 w-2 rounded-full bg-rose-500/30" />
            <div className="h-2 w-2 rounded-full bg-amber-500/30" />
            <div className="h-2 w-2 rounded-full bg-emerald-500/30" />
          </div>
        </div>
      </div>

      {/* Terminal Content */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed text-slate-400 selection:bg-emerald-500/30 selection:text-emerald-200"
      >
        <div className="mb-4 flex items-center gap-3 border-b border-white/5 pb-2">
          <Database className="h-3 w-3 text-indigo-400" />
          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">
            Source: {address.slice(0, 8)}...{address.slice(-6)}
          </span>
          <span className="ml-auto text-[9px] text-slate-600 font-bold uppercase">
            STATUS: ACTIVE
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <span className="shrink-0 text-accent font-black tracking-tighter">&gt;</span>
            <div className="whitespace-pre-wrap">
              <DecryptText text={displayedText} speed={10} />
            </div>
          </div>
          {index < fullText.length && (
            <span className="inline-block h-3 w-1.5 animate-pulse bg-emerald-500/50" />
          )}
        </div>
      </div>

      {/* Terminal Footer */}
      <div className="border-t border-border bg-muted/20 px-4 py-2 flex items-center justify-between">
         <span className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter animate-pulse">
            Listening for network signals...
         </span>
         <span className="text-[9px] font-mono text-slate-700">
            LLM-70B-INSTR-V1
         </span>
      </div>
    </div>
  )
}
