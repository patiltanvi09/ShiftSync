import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ShiftSync from './ShiftSync.jsx';
import './shift.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ShiftSync />
  </StrictMode>,
);
