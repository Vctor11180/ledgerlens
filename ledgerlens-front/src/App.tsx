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
