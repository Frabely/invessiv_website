import type { LandingSectionCopy } from "@/content/landing/home";

type ServiceVisualVariant = NonNullable<
  NonNullable<LandingSectionCopy["serviceCards"]>[number]["visualVariant"]
>;

type ServiceCardVisualProps = {
  visualVariant?: ServiceVisualVariant;
};

export function ServiceCardVisual({ visualVariant }: ServiceCardVisualProps) {
  return (
    <div className="services-visual-media" aria-hidden="true">
      {visualVariant === "ai" ? (
        <svg fill="none" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg">
          <rect
            fill="rgba(255,255,255,0.05)"
            height="74"
            rx="14"
            stroke="rgba(154,179,220,0.3)"
            width="250"
            x="58"
            y="92"
          />
          <rect fill="rgba(255,255,255,0.09)" height="8" rx="4" width="136" x="84" y="114" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="170" x="84" y="130" />
          <rect fill="rgba(231,154,73,0.24)" height="10" rx="5" width="88" x="84" y="146" />

          <rect
            fill="rgba(255,255,255,0.06)"
            height="110"
            rx="16"
            stroke="rgba(154,179,220,0.34)"
            width="186"
            x="352"
            y="74"
          />
          <circle cx="445" cy="108" fill="rgba(231,154,73,0.24)" r="18" />
          <path
            d="M445 98v20M435 108h20"
            stroke="rgba(255,245,233,0.8)"
            strokeLinecap="round"
            strokeWidth="2.2"
          />
          <rect fill="rgba(255,255,255,0.09)" height="8" rx="4" width="104" x="393" y="138" />
          <rect fill="rgba(126,152,190,0.25)" height="8" rx="4" width="72" x="409" y="152" />

          <rect
            fill="rgba(255,255,255,0.05)"
            height="56"
            rx="12"
            stroke="rgba(154,179,220,0.3)"
            width="214"
            x="610"
            y="82"
          />
          <rect fill="rgba(255,255,255,0.09)" height="8" rx="4" width="88" x="636" y="102" />
          <rect fill="rgba(132,244,223,0.23)" height="8" rx="4" width="116" x="636" y="116" />

          <rect
            fill="rgba(255,255,255,0.05)"
            height="56"
            rx="12"
            stroke="rgba(154,179,220,0.3)"
            width="214"
            x="610"
            y="146"
          />
          <rect fill="rgba(255,255,255,0.09)" height="8" rx="4" width="92" x="636" y="166" />
          <rect fill="rgba(231,154,73,0.24)" height="8" rx="4" width="124" x="636" y="180" />

          <path
            d="M308 129h32m198 0h32"
            stroke="rgba(146,171,208,0.46)"
            strokeLinecap="round"
            strokeWidth="6"
          />
        </svg>
      ) : visualVariant === "website" ? (
        <svg fill="none" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg">
          <rect
            fill="rgba(255,255,255,0.06)"
            height="186"
            rx="18"
            stroke="rgba(154,179,220,0.3)"
            width="574"
            x="86"
            y="34"
          />
          <rect fill="rgba(194,220,255,0.12)" height="28" rx="9" width="574" x="86" y="34" />
          <circle cx="110" cy="48" fill="rgba(255,255,255,0.36)" r="4" />
          <circle cx="124" cy="48" fill="rgba(255,255,255,0.28)" r="4" />
          <circle cx="138" cy="48" fill="rgba(255,255,255,0.22)" r="4" />

          <rect fill="rgba(255,255,255,0.08)" height="122" rx="12" width="182" x="104" y="76" />
          <rect fill="rgba(255,255,255,0.1)" height="10" rx="5" width="102" x="124" y="96" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="142" x="124" y="114" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="122" x="124" y="130" />
          <rect fill="rgba(231,154,73,0.3)" height="22" rx="8" width="78" x="124" y="154" />

          <rect fill="rgba(194,220,255,0.1)" height="58" rx="10" width="336" x="304" y="76" />
          <rect fill="rgba(255,255,255,0.1)" height="8" rx="4" width="118" x="324" y="94" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="286" x="324" y="110" />

          <rect fill="rgba(194,220,255,0.1)" height="58" rx="10" width="160" x="304" y="142" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="112" x="324" y="160" />
          <rect fill="rgba(132,244,223,0.24)" height="8" rx="4" width="82" x="324" y="176" />

          <rect fill="rgba(194,220,255,0.1)" height="58" rx="10" width="160" x="480" y="142" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="112" x="500" y="160" />
          <rect fill="rgba(231,154,73,0.25)" height="8" rx="4" width="92" x="500" y="176" />

          <rect
            fill="rgba(255,255,255,0.07)"
            height="148"
            rx="16"
            stroke="rgba(154,179,220,0.3)"
            width="136"
            x="694"
            y="72"
          />
          <rect fill="rgba(194,220,255,0.12)" height="16" rx="6" width="88" x="718" y="90" />
          <rect fill="rgba(255,255,255,0.09)" height="56" rx="10" width="96" x="714" y="114" />
          <rect fill="rgba(132,244,223,0.22)" height="8" rx="4" width="62" x="730" y="178" />
        </svg>
      ) : visualVariant === "tools" ? (
        <svg fill="none" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg">
          <rect
            fill="rgba(255,255,255,0.06)"
            height="186"
            rx="18"
            stroke="rgba(154,179,220,0.3)"
            width="764"
            x="68"
            y="34"
          />

          <rect
            fill="rgba(194,220,255,0.12)"
            height="72"
            rx="12"
            stroke="rgba(154,179,220,0.24)"
            width="186"
            x="98"
            y="94"
          />
          <rect fill="rgba(255,255,255,0.1)" height="8" rx="4" width="90" x="118" y="114" />
          <rect fill="rgba(132,244,223,0.22)" height="8" rx="4" width="136" x="118" y="130" />

          <rect
            fill="rgba(194,220,255,0.12)"
            height="72"
            rx="12"
            stroke="rgba(154,179,220,0.24)"
            width="186"
            x="356"
            y="58"
          />
          <rect fill="rgba(255,255,255,0.1)" height="8" rx="4" width="82" x="376" y="78" />
          <rect fill="rgba(231,154,73,0.24)" height="8" rx="4" width="126" x="376" y="94" />

          <rect
            fill="rgba(194,220,255,0.12)"
            height="72"
            rx="12"
            stroke="rgba(154,179,220,0.24)"
            width="186"
            x="356"
            y="142"
          />
          <rect fill="rgba(255,255,255,0.1)" height="8" rx="4" width="88" x="376" y="162" />
          <rect fill="rgba(132,244,223,0.22)" height="8" rx="4" width="136" x="376" y="178" />

          <rect
            fill="rgba(194,220,255,0.12)"
            height="72"
            rx="12"
            stroke="rgba(154,179,220,0.24)"
            width="186"
            x="614"
            y="94"
          />
          <rect fill="rgba(255,255,255,0.1)" height="8" rx="4" width="92" x="634" y="114" />
          <rect fill="rgba(231,154,73,0.24)" height="8" rx="4" width="134" x="634" y="130" />

          <path
            d="M286 130h52M542 96h56M542 168h56"
            stroke="rgba(146,171,208,0.46)"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <path
            d="m334 130 8-6v12l-8-6Zm260-34 8-6v12l-8-6Zm0 72 8-6v12l-8-6Z"
            fill="rgba(255,245,233,0.82)"
          />

          <rect fill="rgba(255,255,255,0.08)" height="18" rx="7" width="112" x="106" y="58" />
          <rect fill="rgba(255,255,255,0.08)" height="18" rx="7" width="92" x="650" y="58" />
        </svg>
      ) : visualVariant === "upgrade" ? (
        <svg fill="none" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg">
          <rect
            fill="rgba(255,255,255,0.05)"
            height="154"
            rx="18"
            stroke="rgba(154,179,220,0.24)"
            width="292"
            x="66"
            y="56"
          />
          <rect fill="rgba(255,255,255,0.08)" height="10" rx="5" width="112" x="92" y="84" />
          <rect fill="rgba(255,255,255,0.06)" height="8" rx="4" width="206" x="92" y="106" />
          <rect fill="rgba(255,255,255,0.06)" height="8" rx="4" width="170" x="92" y="122" />
          <rect fill="rgba(189,104,66,0.22)" height="8" rx="4" width="188" x="92" y="138" />
          <rect fill="rgba(194,220,255,0.07)" height="44" rx="10" width="206" x="92" y="156" />

          <rect
            fill="rgba(255,255,255,0.07)"
            height="154"
            rx="18"
            stroke="rgba(154,179,220,0.34)"
            width="292"
            x="542"
            y="56"
          />
          <rect fill="rgba(255,255,255,0.1)" height="10" rx="5" width="146" x="568" y="84" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="226" x="568" y="106" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="200" x="568" y="122" />
          <rect fill="rgba(132,244,223,0.24)" height="8" rx="4" width="208" x="568" y="138" />
          <rect fill="rgba(194,220,255,0.11)" height="44" rx="10" width="226" x="568" y="156" />

          <circle cx="450" cy="132" fill="rgba(255,255,255,0.08)" r="28" />
          <path
            d="M436 132h28m-12-12 12 12-12 12"
            stroke="rgba(255,245,233,0.82)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
          />
        </svg>
      ) : (
        <svg fill="none" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg">
          <rect
            fill="rgba(255,255,255,0.05)"
            height="174"
            rx="18"
            stroke="rgba(154,179,220,0.28)"
            width="764"
            x="68"
            y="40"
          />
          <rect fill="rgba(255,255,255,0.08)" height="10" rx="5" width="78" x="100" y="66" />
          <rect fill="rgba(255,255,255,0.08)" height="10" rx="5" width="58" x="188" y="66" />

          <rect fill="rgba(255,255,255,0.13)" height="22" rx="7" width="266" x="100" y="92" />
          <rect fill="rgba(255,255,255,0.1)" height="10" rx="5" width="228" x="100" y="124" />
          <rect fill="rgba(255,255,255,0.08)" height="10" rx="5" width="194" x="100" y="140" />

          <rect fill="rgba(231,154,73,0.28)" height="30" rx="9" width="132" x="100" y="162" />
          <rect fill="rgba(194,220,255,0.12)" height="30" rx="9" width="122" x="242" y="162" />

          <rect
            fill="rgba(194,220,255,0.08)"
            height="104"
            rx="14"
            stroke="rgba(154,179,220,0.3)"
            width="304"
            x="474"
            y="88"
          />
          <rect fill="rgba(255,255,255,0.1)" height="8" rx="4" width="130" x="502" y="112" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="248" x="502" y="128" />
          <rect fill="rgba(255,255,255,0.08)" height="8" rx="4" width="206" x="502" y="144" />
          <rect fill="rgba(132,244,223,0.22)" height="8" rx="4" width="156" x="502" y="160" />

          <path
            d="M390 177 434 156"
            stroke="rgba(146,171,208,0.46)"
            strokeLinecap="round"
            strokeWidth="6"
          />
          <circle cx="434" cy="156" fill="rgba(231,154,73,0.32)" r="7" />
        </svg>
      )}
    </div>
  );
}
