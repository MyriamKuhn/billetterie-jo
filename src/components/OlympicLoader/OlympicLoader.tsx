import { keyframes } from '@emotion/react';
import Box from '@mui/material/Box';

// Animation de rotation full 360°
const slide = keyframes`
  0%   { transform: translateX(0);   opacity: 0.6; }
  25%  { opacity: 1; }
  50%  { transform: translateX(20px); opacity: 0.6; }
  75%  { opacity: 1; }
  100% { transform: translateX(0);   opacity: 0.6; }
`;

function OlympicLoader() {
  return (
    <Box
      sx={{
        display: 'inline-block',
        animation: `${slide} 1.5s ease-in-out infinite`,
        // Centrage si besoin dans un container
        width: 160,
        height: 84,
      }}
    >
      <svg
        viewBox="0 0 230 120"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50"  cy="50" r="30" stroke="#0072CE" strokeWidth="8" fill="none" />
        <circle cx="110" cy="50" r="30" stroke="#000000" strokeWidth="8" fill="none" />
        <circle cx="170" cy="50" r="30" stroke="#DF0024" strokeWidth="8" fill="none" />

        <circle cx="80"  cy="85" r="30" stroke="#F4C300" strokeWidth="8" fill="none" />
        <circle cx="140" cy="85" r="30" stroke="#00A651" strokeWidth="8" fill="none" />
      </svg>
    </Box>
  );
}

export default OlympicLoader;
