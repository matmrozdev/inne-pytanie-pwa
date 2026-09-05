import React from 'react';import{createRoot}from'react-dom/client';import App from'./App';import'./styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App/></React.StrictMode>);
if('serviceWorker'in navigator&&import.meta.env.PROD){
 const wasControlled=Boolean(navigator.serviceWorker.controller);let reloading=false;
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(wasControlled&&!reloading){reloading=true;window.location.reload()}});
 window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').then(registration=>registration.update()));
}
