import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ThemeProvider } from "@/context/ThemeContext"

function App() {
  return (
    <ThemeProvider>
      <DashboardLayout />
    </ThemeProvider>
  )
}

export default App

// Sync update: 2026-04-01
