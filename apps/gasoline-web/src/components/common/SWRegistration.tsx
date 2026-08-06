'use client'

import { useEffect } from 'react'

export function SWRegistration() {
	useEffect(() => {
		if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
			window.addEventListener('load', () => {
				navigator.serviceWorker
					.register('/sw.js')
					.then(registration => {
						console.log('[PWA] Service Worker registered with scope:', registration.scope)

						// Check for SW updates
						registration.onupdatefound = () => {
							const installingWorker = registration.installing
							if (installingWorker) {
								installingWorker.onstatechange = () => {
									if (
										installingWorker.state === 'installed' &&
										navigator.serviceWorker.controller
									) {
										console.log('[PWA] New content available; please refresh.')
									}
								}
							}
						}
					})
					.catch(error => {
						console.error('[PWA] Service Worker registration failed:', error)
					})
			})
		} else if ('serviceWorker' in navigator) {
			// In development mode, register as well for local testing
			navigator.serviceWorker
				.register('/sw.js')
				.then(registration => {
					console.log('[PWA-Dev] SW registered:', registration.scope)
				})
				.catch(err => {
					console.log('[PWA-Dev] SW registration error:', err)
				})
		}
	}, [])

	return null
}
