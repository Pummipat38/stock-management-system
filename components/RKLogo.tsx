export default function RKLogo({ className = "w-32 h-16" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 400 180" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* RK Letters */}
      <g>
        {/* R Letter */}
        <path 
          d="M10 20 L10 100 L30 100 L30 70 L45 70 L60 100 L85 100 L65 65 C75 62 85 52 85 38 C85 22 72 20 55 20 L10 20 Z M30 35 L30 55 L55 55 C62 55 68 52 68 45 C68 38 62 35 55 35 L30 35 Z" 
          fill="#E53E3E"
        />
        
        {/* K Letter */}
        <path 
          d="M110 20 L110 100 L130 100 L130 65 L150 45 L180 100 L210 100 L170 50 L205 20 L175 20 L150 45 L130 20 L110 20 Z" 
          fill="#E53E3E"
        />
      </g>
      
      {/* TAKASAGO CHAIN Text */}
      <g>
        <text x="10" y="140" fill="#1E3A8A" fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif">
          TAKASAGO CHAIN
        </text>
      </g>
    </svg>
  );
}
