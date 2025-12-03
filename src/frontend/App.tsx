import { useState, useEffect } from 'react';

function App() {
  const [data, setData] = useState<Record<string, unknown>>({});
  const [status, setStatus] = useState<string>('Loading...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus('error'));

    fetch('/api/data')
      .then((res) => res.json())
      .then((data) => setData(data))
      .catch(console.error);
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Space Weirdos</h1>
      <p>Backend Status: {status}</p>
      <h2>Data:</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export default App;
