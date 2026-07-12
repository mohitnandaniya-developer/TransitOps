import { useState, useEffect } from 'react';
import { FiMapPin, FiClock, FiTruck } from 'react-icons/fi';
import RouteTracker from '../Components/RouteTracker';
import { Sidebar } from './Dashboard';
import api from '../api';
import '../Styles/global.css';

export default function RouteTracking({ user, onNavigate, onLogout, theme, onToggleTheme, permissions = [] }) {
  const [cities, setCities] = useState([]);
  const [source, setSource] = useState('Mumbai');
  const [destination, setDestination] = useState('Delhi');
  const [tripStartTime, setTripStartTime] = useState('09:00 AM');
  const [currentTime, setCurrentTime] = useState('02:30 PM');
  const [averageSpeed, setAverageSpeed] = useState(45);
  const [showTracker, setShowTracker] = useState(false);
  const [trackKey, setTrackKey] = useState(0); // increments on each Generate to force RouteTracker remount

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await api.get('/route/cities');
      setCities(response.data.cities);
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  };

  const handleGenerateRoute = () => {
    if (source && destination && tripStartTime && currentTime) {
      setTrackKey(k => k + 1); // force remount so initialTimeRef picks up the new currentTime
      setShowTracker(true);
    }
  };

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        currentPage="tracking"
        onNavigate={onNavigate}
        onLogout={onLogout}
        theme={theme}
        onToggleTheme={onToggleTheme}
        permissions={permissions}
      />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-title">Route Tracking</div>
            <div className="topbar-sub">Real-time truck tracking with dynamic route generation</div>
          </div>
        </div>

        <div className="page-body">
          {/* Route Configuration */}
          <div style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '24px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px' }}>
              Route Configuration
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px',
            }}>
              {/* Source */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  <FiMapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Source City
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                >
                  {cities.map(city => (
                    <option key={city.name} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  <FiMapPin size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Destination City
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                >
                  {cities.map(city => (
                    <option key={city.name} value={city.name}>{city.name}</option>
                  ))}
                </select>
              </div>

              {/* Trip Start Time */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  <FiClock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Trip Start Time
                </label>
                <input
                  type="text"
                  value={tripStartTime}
                  onChange={(e) => setTripStartTime(e.target.value)}
                  placeholder="HH:MM AM/PM"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Current Time */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  <FiClock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Current Time
                </label>
                <input
                  type="text"
                  value={currentTime}
                  onChange={(e) => setCurrentTime(e.target.value)}
                  placeholder="HH:MM AM/PM"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                />
              </div>

              {/* Average Speed */}
              <div>
                <label style={{ fontSize: '12px', color: 'var(--muted)', display: 'block', marginBottom: '6px' }}>
                  <FiTruck size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  Average Speed (km/h)
                </label>
                <input
                  type="number"
                  value={averageSpeed}
                  onChange={(e) => setAverageSpeed(parseInt(e.target.value) || 45)}
                  min="20"
                  max="100"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text)',
                    fontSize: '13px',
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleGenerateRoute}
              style={{
                padding: '10px 20px',
                backgroundColor: 'var(--accent)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
              }}
            >
              Generate Route & Track
            </button>
          </div>

          {/* Route Tracker Component */}
          {showTracker && (
            <RouteTracker
              key={trackKey}
              source={source}
              destination={destination}
              tripStartTime={tripStartTime}
              currentTime={currentTime}
              averageSpeed={averageSpeed}
            />
          )}
        </div>
      </div>
    </div>
  );
}
