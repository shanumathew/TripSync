import React from 'react';
import { LoadScript } from '@react-google-maps/api';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places', 'geometry', 'drawing'];

/**
 * MapContainer - LoadScript wrapper for Google Maps
 * Loads Google Maps API once for the entire app
 */
const MapContainer = ({ children }) => {
  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '400px',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div>
          <h3 style={{ color: '#d32f2f', marginBottom: '10px' }}>⚠️ Google Maps API Key Missing</h3>
          <p style={{ color: '#666' }}>
            Please add your Google Maps API key to the .env file:
            <br />
            <code style={{ 
              backgroundColor: '#f0f0f0', 
              padding: '4px 8px', 
              borderRadius: '4px',
              display: 'inline-block',
              marginTop: '8px'
            }}>
              VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
            </code>
          </p>
        </div>
      </div>
    );
  }

  return (
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={LIBRARIES}
      loadingElement={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '400px',
          backgroundColor: '#f5f5f5',
          border: '1px solid #ddd',
          borderRadius: '8px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #f3f3f3',
              borderTop: '4px solid #3498db',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }} />
            <p style={{ color: '#666' }}>Loading Google Maps...</p>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      }
    >
      {children}
    </LoadScript>
  );
};

export default MapContainer;
