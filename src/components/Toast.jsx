import React from 'react';

function Toast({ message, onDone }) {
  React.useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, []);
  return <div className="toast">✓ {message}</div>;
}

export default Toast;
