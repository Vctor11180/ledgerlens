import { useEffect, useState } from "react"

interface DecryptTextProps {
  text: string
  speed?: number
  delay?: number
  className?: string
  as?: "span" | "h1" | "h2" | "p" | "div"
}

const CHARS = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+<>?/[{}]:;"

export function DecryptText({
  text,
  speed = 10,
  delay = 0,
  className = "",
  as: Component = "span"
}: DecryptTextProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout
    let iterations = 0
    const maxIterations = text.length

    const startAnimation = () => {
      setIsAnimating(true)
      const interval = setInterval(() => {
        setDisplayedText(
          text
            .split("")
            .map((_char, index) => {
              if (index < iterations) {
                return text[index]
              }
              return CHARS[Math.floor(Math.random() * CHARS.length)]
            })
            .join("")
        )

        if (iterations >= maxIterations) {
          clearInterval(interval)
          setIsAnimating(false)
        }

        iterations += 2 // Revelar 2 caracteres cada 10ms (200 chars/seg)
      }, speed)
      return () => clearInterval(interval)
    }

    timeout = setTimeout(startAnimation, delay)
    return () => clearTimeout(timeout)
  }, [text, speed, delay])

  return (
    <Component className={className}>
      {displayedText || (isAnimating ? "" : text)}
    </Component>
  )
}
