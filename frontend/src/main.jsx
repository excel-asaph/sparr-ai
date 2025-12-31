/**
 * @fileoverview Application Entry Point
 * 
 * React application bootstrap file. Mounts the root App component
 * to the DOM with React StrictMode enabled for development warnings.
 * 
 * @module main
 * @requires react
 * @requires react-dom/client
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Mount React application to DOM root element
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
