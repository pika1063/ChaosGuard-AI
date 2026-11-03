import React from 'react';import {createRoot} from 'react-dom/client';import {BrowserRouter} from 'react-router-dom';import App from './App';import './index.css';
try{if(localStorage.getItem('cg_theme')==='light')document.documentElement.classList.add('light')}catch{}
createRoot(document.getElementById('root')!).render(<React.StrictMode><BrowserRouter><App/></BrowserRouter></React.StrictMode>);
