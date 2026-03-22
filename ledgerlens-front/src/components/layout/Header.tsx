import { useEffect, useRef, useState } from "react"
import { Search, Loader2, Eye, Wallet, LogOut, ChevronDown } from "lucide-react"
import {
  useBalance,
  useConnect,
  useConnection,
  useDisconnect,
  useSwitchChain,
} from "wagmi"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAnalysisStore } from "@/features/analysis/store/useAnalysisStore"
import { useRunAnalysis } from "@/features/analysis/hooks/useRunAnalysis"
import type { SupportedChain } from "@/lib/api"
import { chainIdForApp } from "@/wagmi"

export function Header({ onRunAgent }: { onRunAgent?: (a?: string) => void }) {
  const [input, setInput] = useState("")
  const [walletMenuOpen, setWalletMenuOpen] = useState(false)
  const walletWrapRef = useRef<HTMLDivElement>(null)
  const { isLoading, reset, chain, setChain } = useAnalysisStore()
  const runAnalysis = useRunAnalysis()

  const { address, status } = useConnection()
  const connected = status === "connected" && !!address
  const { data: balance } = useBalance({ address: connected ? address : undefined })
  const { mutate: connect, connectors, isPending: isConnecting } = useConnect()
  const { mutateAsync: disconnectAsync, isPending: isDisconnecting } =
    useDisconnect()
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain()

  useEffect(() => {
    if (address) setInput(address)
  }, [address])

  useEffect(() => {
    if (!walletMenuOpen) return
    const onDoc = (ev: MouseEvent) => {
      if (
        walletWrapRef.current &&
        !walletWrapRef.current.contains(ev.target as Node)
      ) {
        setWalletMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", onDoc)
    return () => document.removeEventListener("mousedown", onDoc)
  }, [walletMenuOpen])

  const handleSearch = () => {
    const addr = input.trim()
    if (!addr) return
    void runAnalysis(addr)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch()
  }

  const handleChainSelect = (value: SupportedChain) => {
    setChain(value)
    if (!connected) return
    const chainId = chainIdForApp[value]
    switchChainAsync({ chainId }).catch(() => {
      /* usuario rechazó o red no añadida */
    })
  }

  const shortAddress = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`

  /** Desconecta la sesión actual y abre el menú para elegir MetaMask u otra wallet (Core, etc.). */
  const changeWallet = async () => {
    try {
      await disconnectAsync()
    } finally {
      setWalletMenuOpen(true)
    }
  }

  /** Al elegir un conector nuevo: primero cortar la sesión anterior si existía (evita conflictos entre proveedores). */
  const connectWithConnector = async (
    connector: NonNullable<(typeof connectors)[number]>
  ) => {
    try {
      if (connected) await disconnectAsync()
    } catch {
      /* seguir: a veces ya no hay sesión */
    }
    connect({ connector })
    setWalletMenuOpen(false)
  }

  const metaMaskConnector = connectors.find((c) => c.id === "metaMask")
  const injectedConnector = connectors.find((c) => c.id === "injected")

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <button
          onClick={reset}
          className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80"
        >
          <Eye className="h-6 w-6 text-indigo-400" />
          <span className="text-lg font-bold tracking-tight text-slate-100">
            Ledger<span className="text-indigo-400">Lens</span>
          </span>
        </button>

        <div className="relative flex flex-1 items-center gap-2">
          <select
            value={chain}
            onChange={(e) =>
              handleChainSelect(e.target.value as SupportedChain)
            }
            disabled={isSwitching}
            className="h-10 rounded-md border border-slate-800 bg-slate-900/50 px-3 text-sm text-slate-200 disabled:opacity-50"
          >
            <option value="avalanche">Avalanche (C-Chain)</option>
            <option value="fuji">Avalanche Fuji (testnet)</option>
            <option value="ethereum">Ethereum</option>
          </select>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Connect wallet to auto-fill, or paste address (0x...)"
              className="h-10 border-slate-800 bg-slate-900/50 pl-10 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500/40"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={isLoading || !input.trim()}
            className="h-10 shrink-0 bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40 rounded-r-none"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : connected && input.trim().toLowerCase() === address?.toLowerCase() ? (
              "Analyze Me"
            ) : (
              "Analyze"
            )}
          </Button>
          {onRunAgent && (
            <Button
              type="button"
              onClick={() => onRunAgent(input.trim())}
              disabled={isLoading}
              className="h-10 shrink-0 bg-emerald-500 text-slate-900 border-l border-emerald-600 font-bold px-4 hover:bg-emerald-400 rounded-l-none"
              title="Autonomous AI Agent Audit (USDC Payment)"
            >
              🤖 AI Agent
            </Button>
          )}
        </div>

        <div className="relative shrink-0" ref={walletWrapRef}>
          {connected ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {balance && (
                <span
                  className="rounded-md bg-slate-800/80 px-2 py-1 font-mono text-xs text-emerald-400"
                  title={`Balance: ${balance.value} wei`}
                >
                  {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)}{" "}
                  {balance.symbol}
                </span>
              )}
              <span className="max-w-[140px] truncate font-mono text-xs text-slate-400">
                {shortAddress(address!)}
              </span>
              <Button
                type="button"
                variant="outline"
                disabled={isDisconnecting}
                onClick={() => changeWallet()}
                className="h-10 shrink-0 border-slate-700 bg-transparent text-xs text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                title="Desconectar y elegir otra wallet (MetaMask, Core, etc.)"
              >
                Cambiar wallet
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isDisconnecting}
                onClick={() => disconnectAsync()}
                className="h-10 shrink-0 gap-2 border-slate-700 bg-transparent text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                <LogOut className="h-4 w-4" />
                Salir
              </Button>
            </div>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setWalletMenuOpen((o) => !o)}
                disabled={isConnecting}
                className="h-10 shrink-0 gap-2 border-slate-700 bg-transparent text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100"
              >
                <Wallet className="h-4 w-4" />
                Connect wallet
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
              {walletMenuOpen && (
                <div className="absolute right-0 top-full z-[100] mt-1 min-w-[220px] rounded-md border border-slate-800 bg-slate-900 py-1 shadow-xl">
                  {metaMaskConnector && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                      onClick={() => connectWithConnector(metaMaskConnector)}
                    >
                      MetaMask
                    </button>
                  )}
                  {injectedConnector && (
                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800"
                      onClick={() => connectWithConnector(injectedConnector)}
                    >
                      Browser wallet (Core, etc.)
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  )
}
