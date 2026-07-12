import { useState, useEffect, useRef, useCallback } from 'react';
import { FiMapPin, FiTruck, FiCheckCircle, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';
import api from '../api';

export default function RouteTracker({ source, destination, tripStartTime, currentTime, averageSpeed = 45 }) {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [displayTime, setDisplayTime] = useState(null);

  // Capture the initial currentTime once at mount so parent re-renders
  // that pass a new inline time string don't re-trigger the effect.
  const initialTimeRef = useRef(currentTime);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Stable refs so useCallback can read latest values without being a dep itself
  const sourceRef = useRef(source);
  const destinationRef = useRef(destination);
  const tripStartTimeRef = useRef(tripStartTime);
  const averageSpeedRef = useRef(averageSpeed);

  useEffect(() => { sourceRef.current = source; }, [source]);
  useEffect(() => { destinationRef.current = destination; }, [destination]);
  useEffect(() => { tripStartTimeRef.current = tripStartTime; }, [tripStartTime]);
  useEffect(() => { averageSpeedRef.current = averageSpeed; }, [averageSpeed]);

  const fetchRoute = useCallback(async (timeToUse = null, isInitialLoad = false) => {
    if (!isInitialLoad) setRefreshing(true);
    try {
      const timeForRequest = timeToUse || getCurrentTime();
      setDisplayTime(timeForRequest);

      const response = await api.post('/route/generate', {
        source: sourceRef.current,
        destination: destinationRef.current,
        trip_start_time: tripStartTimeRef.current,
        current_time: timeForRequest,
        average_speed_kmph: averageSpeedRef.current,
      });
      setRouteData(response.data);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to generate route';
      setError(errorMsg);
      console.error('Route generation error:', err);
    } finally {
      if (!isInitialLoad) setRefreshing(false);
    }
  }, []); // stable — reads from refs

  const handleRefresh = useCallback(() => {
    fetchRoute(null, false);
  }, [fetchRoute]);

  // Only run once at mount using the captured initial time.
  // Intentionally NOT in the dep array for currentTime to avoid re-fetching
  // every time the parent re-renders with a freshly computed inline time string.
  useEffect(() => {
    const loadRoute = async () => {
      setLoading(true);
      try {
        // Use the time frozen at mount; if not provided, use real system time
        const startTime = initialTimeRef.current || getCurrentTime();
        await fetchRoute(startTime, true);
      } finally {
        setLoading(false);
      }
    };

    if (source && destination && tripStartTime) {
      loadRoute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, destination, tripStartTime, averageSpeed]);

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>
        Loading route data...
      </div>
    );
  }

  if (error && !routeData) {
    return (
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--error-bg, #fee)',
        color: 'var(--error-text, #c00)',
        borderRadius: '8px',
        border: '1px solid var(--error-border, #fcc)',
      }}>
        ⚠️ {error}
      </div>
    );
  }

  if (!routeData) {
    return null;
  }

  const { summary, route, live_status } = routeData;

  const getStatusIcon = () => {
    switch (live_status.status) {
      case 'Arrived':
        return <FiCheckCircle size={20} style={{ color: 'var(--success)' }} />;
      case 'In Transit':
        return <FiTruck size={20} style={{ color: 'var(--accent)' }} />;
      case 'Not Started':
        return <FiAlertCircle size={20} style={{ color: 'var(--warning)' }} />;
      default:
        return <FiMapPin size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (live_status.status) {
      case 'Arrived':
        return 'var(--success)';
      case 'In Transit':
        return 'var(--accent)';
      case 'Not Started':
        return 'var(--warning)';
      default:
        return 'var(--muted)';
    }
  };

  return (
    <div style={{ padding: '20px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px' }}>
      {/* Error Alert if present */}
      {error && (
        <div style={{
          padding: '12px',
          backgroundColor: 'var(--error-bg, #fee)',
          color: 'var(--error-text, #c00)',
          borderRadius: '6px',
          border: '1px solid var(--error-border, #fcc)',
          marginBottom: '16px',
          fontSize: '12px',
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Header with Refresh Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Route Tracking</h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '600',
            opacity: refreshing ? 0.6 : 1,
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => !refreshing && (e.target.style.backgroundColor = 'var(--accent-dark, #ff8c00)')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = 'var(--accent)')}
        >
          <FiRefreshCw size={14} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Summary Section */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Highway</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>{summary.highway_route}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Total Duration</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            {(() => {
              const duration = summary.total_duration;
              if (typeof duration === 'string' && duration.includes('hr')) {
                return duration;
              }
              // Fallback formatting if backend returns old format
              const match = duration.match(/(\d+)h\s*([\d.]+)m/);
              if (match) {
                const hours = match[1];
                const minutes = Math.round(parseFloat(match[2]));
                const paddedMin = String(minutes).padStart(2, '0');
                return `${hours}hr ${paddedMin}min`;
              }
              return duration;
            })()}
          </div>
        </div>
        <div style={{ padding: '12px', backgroundColor: 'var(--bg-primary)', borderRadius: '8px' }}>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '4px' }}>Avg Speed</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>{summary.average_speed_kmph} km/h</div>
        </div>
      </div>

      {/* Live Status Section */}
      <div style={{
        padding: '16px',
        backgroundColor: 'var(--bg-primary)',
        borderRadius: '8px',
        marginBottom: '24px',
        borderLeft: `4px solid ${getStatusColor()}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          {getStatusIcon()}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600' }}>
              {live_status.status}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
              Current Time: {displayTime || live_status.current_time || '—'}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '12px',
          fontSize: '13px',
        }}>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Last Checkpoint</div>
            <div style={{ fontWeight: '600' }}>{live_status.last_checkpoint}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Current Position</div>
            <div style={{ fontWeight: '600' }}>{live_status.current_position}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Next Checkpoint</div>
            <div style={{ fontWeight: '600' }}>{live_status.next_checkpoint}</div>
          </div>
          <div>
            <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>ETA to Next</div>
            <div style={{ fontWeight: '600' }}>{live_status.eta_to_next}</div>
          </div>
        </div>

        {/* Progress Bar */}
        {live_status.status === 'In Transit' && (
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
              Progress: {live_status.progress_percentage}%
            </div>
            <div style={{
              width: '100%',
              height: '8px',
              backgroundColor: 'var(--border)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${live_status.progress_percentage}%`,
                height: '100%',
                backgroundColor: 'var(--accent)',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Route Checkpoints */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>Route Checkpoints</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {route.map((checkpoint, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: '8px',
                borderLeft: `3px solid ${
                  checkpoint.location === live_status.current_position ? 'var(--accent)' :
                  checkpoint.cumulative_distance_km <= (live_status.last_checkpoint === checkpoint.location ? checkpoint.cumulative_distance_km : 0) ? 'var(--success)' :
                  'var(--border)'
                }`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{checkpoint.location}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {checkpoint.distance_from_previous_km > 0 && `+${checkpoint.distance_from_previous_km} km`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '600', fontSize: '13px' }}>{checkpoint.eta}</div>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {checkpoint.cumulative_distance_km} km
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
