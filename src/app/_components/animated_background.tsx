export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="absolute inset-0">
        <svg
          className="h-full w-full opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                style={{ stopColor: "#0066a1", stopOpacity: 0.3 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "#005280", stopOpacity: 0.1 }}
              />
            </linearGradient>
          </defs>

          <g className="animate-float-slow">
            <circle cx="10%" cy="20%" r="100" fill="url(#grad1)" />
            <circle cx="85%" cy="70%" r="150" fill="url(#grad1)" />
          </g>

          <g className="animate-float-slower">
            <rect
              x="60%"
              y="10%"
              width="200"
              height="200"
              rx="20"
              fill="url(#grad1)"
              opacity="0.2"
              transform="rotate(45 70% 20%)"
            />
          </g>

          <g className="animate-float">
            <circle cx="25%" cy="75%" r="80" fill="url(#grad1)" opacity="0.3" />
            <circle
              cx="90%"
              cy="30%"
              r="120"
              fill="url(#grad1)"
              opacity="0.2"
            />
          </g>

          <g className="animate-float-slower">
            <path
              d="M 40% 40% Q 45% 35%, 50% 40% T 60% 40%"
              stroke="#00629B"
              strokeWidth="2"
              fill="none"
              opacity="0.2"
            />
          </g>
        </svg>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          50% { transform: translateY(-10px) translateX(-10px); }
          75% { transform: translateY(-30px) translateX(5px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
          33% { transform: translateY(-30px) translateX(20px) rotate(2deg); }
          66% { transform: translateY(-15px) translateX(-15px) rotate(-2deg); }
        }

        @keyframes float-slower {
          0%, 100% { transform: translateY(0px) translateX(0px) scale(1); }
          50% { transform: translateY(-40px) translateX(-20px) scale(1.05); }
        }

        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 25s ease-in-out infinite;
        }

        .animate-float-slower {
          animation: float-slower 30s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
