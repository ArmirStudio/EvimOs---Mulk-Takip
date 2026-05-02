import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface EvimOsSVGLogoProps {
  size?: number;
  variant?: 'full' | 'icon' | 'text-only';
  isDarkMode?: boolean;
}

export const EvimOsSVGLogo: React.FC<EvimOsSVGLogoProps> = ({
  size = 200,
  variant = 'full',
  isDarkMode = false,
}) => {
  // Colors: Copper, Green, Brown
  const copperDark = '#8B6F47';
  const copperMain = '#C8925A';
  const copperLight = '#D4A574';
  const greenDark = '#2D6A4F';
  const greenMain = '#40916C';
  const greenLight = '#52B788';
  const brownDark = '#6B5C4D';

  // Scale factor for SVG viewBox
  const scale = size / 200;

  if (variant === 'text-only') {
    return (
      <Svg width={size} height={size * 0.4} viewBox="0 0 200 80">
        <Defs>
          <LinearGradient id="textGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={greenMain} />
            <Stop offset="100%" stopColor={copperMain} />
          </LinearGradient>
        </Defs>
        {/* EvimOs Text */}
        <SvgText
          x="100"
          y="35"
          fontSize="32"
          fontWeight="bold"
          textAnchor="middle"
          fill={greenMain}
          fontFamily="Arial, sans-serif"
        >
          EvimOs
        </SvgText>
        {/* Mülk Yönetim Subtitle */}
        <SvgText
          x="100"
          y="58"
          fontSize="12"
          fontWeight="400"
          textAnchor="middle"
          fill={copperMain}
          fontFamily="Arial, sans-serif"
        >
          Mülk Yönetim
        </SvgText>
      </Svg>
    );
  }

  if (variant === 'icon') {
    return (
      <Svg width={size} height={size} viewBox="0 0 200 200">
        <Defs>
          <LinearGradient id="copper" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={copperLight} />
            <Stop offset="100%" stopColor={copperDark} />
          </LinearGradient>
        </Defs>

        {/* Outer Circle */}
        <Circle cx="100" cy="100" r="95" fill="none" stroke="url(#copper)" strokeWidth="8" />

        {/* House Base */}
        <Path
          d="M 60 130 L 60 85 L 85 65 L 85 130 Z"
          fill={copperMain}
          stroke={copperDark}
          strokeWidth="1"
        />

        {/* House Roof Right */}
        <Path
          d="M 85 65 L 115 65 L 115 95 Z"
          fill={greenMain}
          stroke={greenDark}
          strokeWidth="1"
        />

        {/* House Right Section */}
        <Path
          d="M 115 95 L 115 130 L 140 130 L 140 85 Z"
          fill={copperMain}
          stroke={copperDark}
          strokeWidth="1"
        />

        {/* Window Top Left */}
        <Circle cx="75" cy="80" r="6" fill={greenLight} />

        {/* Window Bottom Right */}
        <Circle cx="125" cy="110" r="6" fill={greenLight} />

        {/* Growth Arrow */}
        <Path
          d="M 110 55 Q 120 45 135 40"
          stroke={greenMain}
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M 135 40 L 140 35 L 138 48"
          fill={greenMain}
        />

        {/* Base Line */}
        <Line x1="60" y1="130" x2="140" y2="130" stroke={copperMain} strokeWidth="2" />
      </Svg>
    );
  }

  // Full variant (default)
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={size} height={size} viewBox="0 0 200 240">
        <Defs>
          <LinearGradient id="copperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={copperLight} />
            <Stop offset="100%" stopColor={copperDark} />
          </LinearGradient>
        </Defs>

        {/* Outer Circle */}
        <Circle cx="100" cy="90" r="88" fill="none" stroke="url(#copperGrad)" strokeWidth="6" />

        {/* House Left Section */}
        <Path
          d="M 55 130 L 55 75 L 80 55 L 80 130 Z"
          fill={copperMain}
          stroke={copperDark}
          strokeWidth="1"
        />

        {/* House Roof (Right) */}
        <Path
          d="M 80 55 L 120 55 L 120 90 Z"
          fill={greenMain}
          stroke={greenDark}
          strokeWidth="1"
        />

        {/* House Right Section */}
        <Path
          d="M 120 90 L 120 130 L 145 130 L 145 75 Z"
          fill={copperMain}
          stroke={copperDark}
          strokeWidth="1"
        />

        {/* Top Window - Left */}
        <Circle cx="70" cy="75" r="5" fill={greenLight} />

        {/* Bottom Window - Right */}
        <Circle cx="130" cy="110" r="5" fill={greenLight} />

        {/* Growth Arrow - Main */}
        <Path
          d="M 105 45 Q 125 25 145 15"
          stroke={greenMain}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Arrow Head */}
        <Path
          d="M 145 15 L 152 8 L 142 28 Z"
          fill={greenMain}
        />

        {/* Second Arrow Accent */}
        <Path
          d="M 115 35 L 135 20"
          stroke={greenLight}
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Foundation Line */}
        <Line x1="55" y1="130" x2="145" y2="130" stroke={copperMain} strokeWidth="2" />

        {/* EvimOs Text */}
        <SvgText
          x="100"
          y="165"
          fontSize="28"
          fontWeight="bold"
          textAnchor="middle"
          fill={greenMain}
          fontFamily="Arial, sans-serif"
          letterSpacing="2"
        >
          EvimOs
        </SvgText>

        {/* Mülk Yönetim Text */}
        <SvgText
          x="100"
          y="190"
          fontSize="11"
          fontWeight="400"
          textAnchor="middle"
          fill={copperMain}
          fontFamily="Arial, sans-serif"
          letterSpacing="1"
        >
          Mülk Yönetim
        </SvgText>
      </Svg>
    </View>
  );
};

// For simple Line component (since SVG might not have it in all versions)
const Line = ({ x1, y1, x2, y2, stroke, strokeWidth }: any) => (
  <Path d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={stroke} strokeWidth={strokeWidth} />
);
