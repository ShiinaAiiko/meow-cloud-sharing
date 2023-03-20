import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import './assets/style/base.scss'
import * as serviceWorkerRegistration from './serviceWorkerRegistration'

import './modules/i18n/i18n'

import './modules/public'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
	// <App />
	<React.StrictMode>
		<App />
	</React.StrictMode>
)

serviceWorkerRegistration.unregister()
serviceWorkerRegistration.register()
// serviceWorkerRegistration.watchPush()
// serviceWorkerRegistration.push()

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
