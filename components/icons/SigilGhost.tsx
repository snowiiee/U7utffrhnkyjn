export function SigilGhost({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%" className={className}>
      <defs>
        <filter id="sigilGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="glowTight" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="glowMid" />
          <feGaussianBlur in="SourceAlpha" stdDeviation="25" result="glowWide" />

          <feFlood floodColor="#444444" result="colorWide" />
          <feComposite in="colorWide" in2="glowWide" operator="in" result="coloredWide" />

          <feFlood floodColor="#888888" result="colorMid" />
          <feComposite in="colorMid" in2="glowMid" operator="in" result="coloredMid" />

          <feFlood floodColor="#cccccc" result="colorTight" />
          <feComposite in="colorTight" in2="glowTight" operator="in" result="coloredTight" />

          <feMerge>
            <feMergeNode in="coloredWide" />
            <feMergeNode in="coloredMid" />
            <feMergeNode in="coloredTight" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g stroke="#555555" fill="none" opacity="0.35">
        <circle cx="250" cy="250" r="220" strokeWidth="3" />
        <circle cx="250" cy="250" r="205" strokeWidth="12" strokeDasharray="12 6 3 6 24 10 5 8" opacity="0.5"/>
        <circle cx="250" cy="250" r="185" strokeWidth="2" />
        
        <polygon points="250,65 410,340 90,340" strokeWidth="3" />
        <polygon points="250,435 410,160 90,160" strokeWidth="3" />
        
        <circle cx="250" cy="250" r="115" strokeWidth="2" />
        <circle cx="250" cy="250" r="105" strokeWidth="1" />
      </g>

      <g fill="#f0f0f0" filter="url(#sigilGlow)">
        
        <path d="M 250,45
                 C 210,95 185,160 180,230
                 L 260,310 
                 L 250,320 
                 L 165,235
                 C 170,155 195,85 250,45 Z" />

        <path d="M 250,45
                 C 290,95 315,160 320,230
                 L 240,310 
                 L 250,320 
                 L 335,235
                 C 330,155 305,85 250,45 Z" />

        <path d="M 185,115
                 L 100,70
                 C 120,105 140,120 170,130
                 L 40,150
                 C 80,150 120,155 150,170
                 L 100,230
                 C 130,215 155,200 175,185 Z" />

        <path d="M 315,115
                 L 400,70
                 C 380,105 360,120 330,130
                 L 460,150
                 C 420,150 380,155 350,170
                 L 400,230
                 C 370,215 345,200 325,185 Z" />

        <path d="M 105,255
                 L 165,225
                 L 155,260
                 L 185,265
                 L 125,305
                 L 140,275 Z" />

        <path d="M 395,255
                 L 335,225
                 L 345,260
                 L 315,265
                 L 375,305
                 L 360,275 Z" />

        <path d="M 105,290
                 L 135,335 L 150,295
                 L 175,345 L 195,300
                 L 220,355 L 250,285
                 L 280,355 L 305,300
                 L 325,345 L 350,295
                 L 365,335 L 395,290
                 C 375,340 350,370 320,385 
                 L 310,430 L 290,395
                 L 275,460 L 260,405
                 L 250,490 L 240,405
                 L 225,460 L 210,395
                 L 190,430 L 180,385
                 C 150,370 125,340 105,290 Z" />

      </g>
    </svg>
  );
}
