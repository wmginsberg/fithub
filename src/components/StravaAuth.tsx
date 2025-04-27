import { useState } from 'react';

interface StravaAuthProps {
  isLoading: boolean;
}

const STRAVA_CLIENT_ID = import.meta.env.VITE_STRAVA_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/`;

export const StravaAuth = ({ isLoading }: StravaAuthProps) => {
  const [isClicking, setIsClicking] = useState(false);

  const handleLogin = () => {
    setIsClicking(true);
    const scope = 'read,activity:read';
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${scope}`;
    window.location.href = authUrl;
  };

  return (
    <button 
      onClick={handleLogin}
      disabled={isLoading || isClicking}
      className="strava-auth-button"
    >
      {isLoading ? 'Connecting to Strava...' : isClicking ? 'Redirecting...' : 'Connect with Strava'}
    </button>
  );
}; 