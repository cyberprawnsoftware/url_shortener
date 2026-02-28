/*
* We need a way to view stats:
* Endpoint which just returns the stored URL information, including clicks and expiry date.
*
* GET: /api/url-stats/:slug
* */

export default defineEventHandler(async (event) => {
    const slug = getRouterParam(event, 'slug')!;
    const storage = getUrlStorage();
    const entry = await storage.findUrlBySlug(slug);

    if (!entry) {
        setResponseStatus(event, 404);

        return {
            success: false,
            errors: ['Short URL not found.']
        };
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

    setResponseStatus(event, 200);

    return {
        success: true,
        slug,
        url: entry.url,
        clicks: entry.clicks,
        createdAt: entry.createdAt,
        expiresAt: entry.expiresAt
    };
});
