import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom React Hook for real-time WebSocket communication for Application Queries and Table updates.
 *
 * @param {string|number} appId - Target Application ID or 'global' for table observers
 * @param {function} onMessageReceived - Callback triggered when an event is received
 * @param {boolean} enabled - Whether the connection should be active
 */
export default function useQueryWebSocket(appId = 'global', onMessageReceived = null, enabled = true) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const onMessageRef = useRef(onMessageReceived);

  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  const connect = useCallback(() => {
    if (!enabled) return;

    // Build WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; // e.g. localhost:5173 or localhost:8000
    
    // In dev mode with Vite proxy or direct backend port
    let wsUrl = `${protocol}//${host}/ws/queries/${appId || 'global'}`;
    if (window.location.port === '5173' || window.location.port === '5174' || window.location.port === '3000') {
      wsUrl = `${protocol}//${window.location.hostname}:8000/ws/queries/${appId || 'global'}`;
    }

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Start ping interval
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PING' }));
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'PONG') return;
          if (onMessageRef.current) {
            onMessageRef.current(data);
          }
        } catch (e) {
          console.debug('WS parse error:', e);
        }
      };

      ws.onerror = (err) => {
        console.debug('WS connection notice:', err);
      };

      ws.onclose = (event) => {
        if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
        // Attempt reconnect if still enabled
        if (enabled && !event.wasClean) {
          if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 3000);
        }
      };
    } catch (err) {
      console.debug('WS init notice:', err);
    }
  }, [appId, enabled]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, 'Component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((payload) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(typeof payload === 'string' ? payload : JSON.stringify(payload));
    }
  }, []);

  return { send, ws: wsRef.current };
}
