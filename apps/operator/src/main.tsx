import React from 'react';
import ReactDOM from 'react-dom/client';

function App() {
  return (
    <main
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'system-ui, sans-serif',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div>
        <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Portal de operarios</h1>
        <p style={{ color: '#475569' }}>En desarrollo (v2).</p>
      </div>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
