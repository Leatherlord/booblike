import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles/main.scss';
import App from './components/App';

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('app');

  if (container) {
    const root = createRoot(container);
    root.render(<App />);
  }
});
