"use client"

export function TypingIndicator() {
  return (
    <div className="flex w-full gap-3 py-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4"
        >
          <path d="M12 8V4H8" />
          <rect width="16" height="12" x="4" y="8" rx="2" />
          <path d="M2 14h2" />
          <path d="M20 14h2" />
          <path d="M15 13v2" />
          <path d="M9 13v2" />
        </svg>
      </div>

      <div className="flex items-center gap-1 rounded-2xl border border-border bg-muted px-4 py-3">
        <div className="flex gap-1">
          <div className="size-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.3s]" />
          <div className="size-2 rounded-full bg-foreground/40 animate-bounce [animation-delay:-0.15s]" />
          <div className="size-2 rounded-full bg-foreground/40 animate-bounce" />
        </div>
      </div>
    </div>
  )
}
