// Disable the browser’s automatic scroll restoration so we can manage scroll position manually
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

// Import global axios configuration (interceptors, defaults, etc.)
import './services/axiosConfig';

import ReactDOM from 'react-dom/client';
import { Root } from './Root';

// Find the root DOM node and initialize React rendering
const container = document.getElementById('root')!;
const root = ReactDOM.createRoot(container);
root.render(<Root />);
