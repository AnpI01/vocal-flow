export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] bg-[#EEF1F6]">
      {/* Signature panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#12141C] text-[#EEF1F6] p-12 relative overflow-hidden">
        <div className="relative z-10">
          <span className="font-mono text-xs tracking-[0.2em] text-[#2FD4C4] uppercase">
            Vocal Flow
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight max-w-sm">
            Every voice, ready to speak any script.
          </h1>
          <p className="mt-4 text-sm text-[#9AA1B2] max-w-xs">
            Clone a voice once. Generate as many scripts as you need, in the
            languages your audience speaks.
          </p>
        </div>

        <Waveform />

        <p className="relative z-10 text-xs text-[#6B7280]">
          Private inference, no third-party voice storage.
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}

function Waveform() {
  // Deterministic-looking bar heights, purely decorative signature element
  const heights = [18, 34, 22, 48, 30, 56, 26, 40, 20, 44, 28, 52, 24, 36, 16];

  return (
    <div
      className="relative z-10 flex items-end gap-[3px] h-16"
      aria-hidden="true"
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-[#2FD4C4]/70"
          style={{
            height: `${h}px`,
            animation: `pulse-bar 1.8s ease-in-out ${i * 0.06}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes pulse-bar {
          0%, 100% { transform: scaleY(0.6); opacity: 0.5; }
          50% { transform: scaleY(1); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          span { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
