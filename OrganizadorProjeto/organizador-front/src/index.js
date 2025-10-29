import React from 'react';
import ReactDOM from 'react-dom/client';
// import './index.css'; // Comentado
import App from './App'; // Esta linha importa o 'App'
// import reportWebVitals from './reportWebVitals'; // Comentado

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// reportWebVitals(); // Comentado