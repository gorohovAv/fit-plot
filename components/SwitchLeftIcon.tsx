import React from 'react';
import { SvgXml } from 'react-native-svg';

const switchLeftXml = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M9 10L4 15L9 20"/>
  <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
</svg>
`;

export const SwitchLeftIcon: React.FC<{ color?: string; size?: number }> = ({ 
  color = 'currentColor', 
  size = 24 
}) => (
  <SvgXml 
    xml={switchLeftXml} 
    width={size} 
    height={size} 
    color={color}
  />
);
