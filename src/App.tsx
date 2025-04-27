import { useState, useEffect } from 'react'
import './App.css'
import { StravaAuth } from './components/StravaAuth'
import { WorkoutGrid } from './components/WorkoutGrid'
import './components/WorkoutGrid.css'

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    // Try to get token from localStorage on initial load
    return localStorage.getItem('strava_access_token');
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for access token in URL (after OAuth redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const authError = urlParams.get('error');
    
    // Only show error if we're in the middle of authentication
    if (authError && code) {
      setError('Authentication was denied or canceled.');
      return;
    }
    
    if (code) {
      setIsLoading(true);
      setError(null);
      
      // Exchange code for access token
      const exchangeCode = async () => {
        try {
          const response = await fetch('https://www.strava.com/oauth/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              client_id: import.meta.env.VITE_STRAVA_CLIENT_ID,
              client_secret: import.meta.env.VITE_STRAVA_CLIENT_SECRET,
              code,
              grant_type: 'authorization_code',
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to connect to Strava. Please try again.');
          }
          
          const data = await response.json();
          if (!data.access_token) {
            throw new Error('No access token received from Strava. Please try again.');
          }
          
          // Store token in localStorage
          localStorage.setItem('strava_access_token', data.access_token);
          setAccessToken(data.access_token);
          setError(null);
          
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('Error exchanging code for token:', error);
          setError(error instanceof Error ? error.message : 'Failed to connect to Strava');
          // Clear any invalid token
          localStorage.removeItem('strava_access_token');
          setAccessToken(null);
        } finally {
          setIsLoading(false);
        }
      };
      
      exchangeCode();
    }
  }, []);

  return (
    <div className="app">
      <div className="app-container">
        <header className="app-header">
          <img src="/fithub-cat-logo.png" alt="FitHub Logo" className="app-logo" />
          <h1>FitHub</h1>
        </header>
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        {!accessToken ? (
          <StravaAuth isLoading={isLoading} />
        ) : (
          <WorkoutGrid accessToken={accessToken} />
        )}
      </div>
    </div>
  )
}

export default App
