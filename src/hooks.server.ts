import type { Handle } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { getSeoSettings } from '$lib/server/seo';
import { getAiDeterrenceSettings, resolveCanonicalTdmPolicyUrl } from '$lib/server/ai-deterrence';

/**
 * Validates access to internal Studio CMS and Studio APIs.
 * Development mode is allowed locally.
 * Production mode requires STUDIO_ENABLED=true and a matching STUDIO_AUTH_TOKEN.
 */
function isAuthorizedStudio(event: Parameters<Handle>[0]['event']): boolean {
	if (dev) return true;
	if (process.env.STUDIO_ENABLED !== 'true') return false;

	const requiredToken = process.env.STUDIO_AUTH_TOKEN?.trim();
	if (!requiredToken) {
		// Fail closed if enabled in production but no token is configured
		return false;
	}

	const authHeader = event.request.headers.get('authorization');
	const tokenHeader = event.request.headers.get('x-studio-token');
	const cookieToken = event.cookies.get('studio_token');

	if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
		const bearerToken = authHeader.slice(7).trim();
		if (bearerToken === requiredToken) return true;
	}

	if (tokenHeader === requiredToken) return true;
	if (cookieToken === requiredToken) return true;

	return false;
}

export const handle: Handle = async ({ event, resolve }) => {
	const pathname = event.url.pathname;

	// Normalize trailing slashes (except root '/') for SEO URL consistency
	if (pathname.length > 1 && pathname.endsWith('/')) {
		const cleanPath = pathname.slice(0, -1) + event.url.search;
		return new Response(null, {
			status: 301,
			headers: { Location: cleanPath },
		});
	}

	// Centralized Studio CMS & API Route Guard
	if (pathname.startsWith('/studio') || pathname.startsWith('/api/studio')) {
		if (!isAuthorizedStudio(event)) {
			if (pathname.startsWith('/api/')) {
				return new Response(JSON.stringify({ error: 'Unauthorized studio API request' }), {
					status: 403,
					headers: { 'Content-Type': 'application/json' },
				});
			}
			return new Response('Studio is only accessible in development mode or with valid authorization.', {
				status: 404,
				headers: { 'Content-Type': 'text/plain' },
			});
		}
	}

	// Dynamic Redirect Engine from content/settings/seo.json
	// Only inspect non-api, non-studio, non-asset paths
	if (
		!pathname.startsWith('/api') &&
		!pathname.startsWith('/studio') &&
		!pathname.startsWith('/_app') &&
		!pathname.startsWith('/images')
	) {
		const seoSettings = getSeoSettings();
		for (const rule of seoSettings.redirects) {
			const cleanFrom = rule.from.replace(/\/+$/, '');
			const cleanTo = rule.to.replace(/\/+$/, '');

			// Prevent open redirects & malicious protocols (only allow relative paths or configured siteUrl)
			const isSafeTarget =
				(cleanTo.startsWith('/') && !cleanTo.startsWith('//')) ||
				(seoSettings.siteUrl && cleanTo.startsWith(seoSettings.siteUrl));
			if (!isSafeTarget) continue;

			// Exact match or prefix match (e.g., /work -> /projects or /work/slug -> /projects/slug)
			if (pathname === cleanFrom) {
				return new Response(null, {
					status: rule.status || 301,
					headers: { Location: `${rule.to}${event.url.search}` },
				});
			} else if (pathname.startsWith(`${cleanFrom}/`)) {
				const remainder = pathname.slice(cleanFrom.length);
				return new Response(null, {
					status: rule.status || 301,
					headers: { Location: `${cleanTo}${remainder}${event.url.search}` },
				});
			}
		}
	}

	const response = await resolve(event);

	// Fetch current AI deterrence configuration from dedicated service
	const aiSettings = getAiDeterrenceSettings();

	// Machine-readable EU AI Act & W3C TDMRep protocol headers (EU Copyright Directive Art. 4)
	if (aiSettings.reserveRights) {
		response.headers.set('TDM-Reservation', '1');
		response.headers.set('TDM-Policy', resolveCanonicalTdmPolicyUrl());
	}

	// HTTP-level Anti-AI scraping and training header
	if (aiSettings.blockTrainingCrawlers) {
		// Allows search indexing while prohibiting AI training & image synthesis models
		response.headers.set('X-Robots-Tag', 'noai, noimageai');
	}

	// Cache-Control for images and static assets
	if (pathname.startsWith('/images/') || pathname.endsWith('.svg') || pathname.endsWith('.webp')) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	}

	// Defensive Security Headers
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
	response.headers.set('Cross-Origin-Resource-Policy', 'same-origin');
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(), geolocation=(), interest-cohort=()'
	);
	response.headers.set(
		'Strict-Transport-Security',
		'max-age=63072000; includeSubDomains; preload'
	);
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline'",
			"img-src 'self' data: blob: https:",
			"font-src 'self' data:",
			"connect-src 'self'",
			"form-action 'self'",
			"frame-ancestors 'none'",
			"object-src 'none'",
			"base-uri 'self'",
		].join('; ')
	);

	return response;
};
