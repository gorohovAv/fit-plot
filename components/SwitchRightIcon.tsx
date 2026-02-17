import React from 'react';
import { SvgXml } from 'react-native-svg';

const switchRightXml = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M15 10L20 15L15 20"/>
  <path d="M4 4v7a4 4 0 0 0 4 4h12"/>
</svg>
`;

export const SwitchRightIcon: React.FC<{ color?: string; size?: number }> = ({ 
  color = 'currentColor', 
  size = 24 
}) => (
  <SvgXml 
    xml={switchRightXml} 
    width={size} 
    height={size} 
    color={color}
  />
);
