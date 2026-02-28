const RESERVED_PATHS = ['api', '_nuxt', 'favicon.ico', 'robots.txt'];

export default defineEventHandler(async (event) => {
    const pathname = getRequestURL(event).pathname;
    const slug = pathname.replace(/^\//, '').split('/')[0];

    // We don't want to redirect reserved paths
    if (!slug || RESERVED_PATHS.includes(slug)) {
        return;
    }

    // Storage singleton
    const storage = getUrlStorage();

    const entry = await storage.findUrlBySlug(slug);

    if (!entry) {
        return;
    }

    if (await storage.isExpired(entry)) {
        // Clean up expired entry
        await storage.delete(slug, entry.url);

        setResponseStatus(event, 410);

        return {
            success: false,
            errors: ['This short URL has expired.']
        };
    }

    await storage.incrementClicks(slug);

    // Finally, redirect to the URL
    return sendRedirect(event, entry.url, 302);
});
