// Desactivate scroll restoration in the browser
if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

import ReactDOM from 'react-dom/client';
import { Root } from './Root';

const container = document.getElementById('root')!;
const root = ReactDOM.createRoot(container);
root.render(<Root />);
