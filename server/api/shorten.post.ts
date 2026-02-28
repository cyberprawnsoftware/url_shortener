/*
* The heart of the app, this endpoint handles the shortening of a URL
*
* POST: /api/shorten
* body: { url: string, expiresIn: number }
*
* Uses appropriate response codes:
*
* 200: success
* 400: bad request (missing body, invalid JSON)
* 422: unprocessable entity (invalid URL, invalid expiresIn)
* 500: internal server error (could not generate slug, could not save URL)
* */

import { randomBytes } from 'crypto';

// Use of response functions to follow the DRY principle
function fail(event: any, status: number, errors: string[], fields?: any) {
    setResponseStatus(event, status);

    return {
        success: false,
        errors,
        ...(fields && { fields })
    };
}

function ok(event: any, data: Record<string, any>) {
    setResponseStatus(event, 200);

    return {
        success: true,
        ...data
    };
}

// Utilise the crypto module to generate a random slug, with a max of 5 attempts (probably unnecessary, but you never know!)
async function generateUniqueSlug(storage: any, maxAttempts = 5): Promise<string | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        // Generate a random slug using crypto.randomBytes of 4, with base64url encoding, which I believe tinyurl uses
        const slug = randomBytes(4).toString('base64url');

        if (!(await storage.slugExists(slug))) {
            return slug;
        }
    }
    return null;
}

/*
* Main event handler for the endpoint.
*
* 1. Read the request body
* 2. Validate
* 3. Check if the URL has already been shortened
* 4. Generate a unique slug
* 5. Save the URL to the storage
* 6. Return the shortened URL and any errors
* */
export default defineEventHandler(async (event) => {
    // Storage singleton
    const storage = getUrlStorage();

    // Read the request body
    let body: { url?: string; expiresIn?: number };

    try {
        body = await readBody(event);
    } catch {
        return fail(event, 400, ['Request body is missing or raw JSON is invalid.']);
    }

    const origin = getRequestURL(event).origin;
    const url = normaliseUrl(body.url ?? '');

    // Validate
    const validation = await validateUrl(url, origin);

    if (!validation.valid) {
        return fail(event, 422, validation.errors, validation.fields);
    }

    // Validate expiresIn if provided
    const expiresIn = body.expiresIn ?? null;

    if (expiresIn !== null && (!Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 365)) {
        return fail(event, 422, ['expiresIn must be a whole number of days between 1 and 365.']);
    }

    // Check if the URL has already been shortened
    const existingSlug = await storage.findSlugByUrl(url);

    if (existingSlug) {
        const entry = await storage.findUrlBySlug(existingSlug);

        return ok(event, {
            existing: true,
            message: 'This URL has already been shortened:',
            slug: existingSlug,
            short: `${origin}/${existingSlug}`,
            clicks: entry?.clicks ?? 0,
            expiresAt: entry?.expiresAt ?? null
        });
    }

    // Generate a unique slug
    const slug = await generateUniqueSlug(storage);

    if (!slug) {
        return fail(event, 500, ['Could not generate a unique slug. Please try again.']);
    }

    // Save the URL to the storage
    try {
        await storage.save(slug, url, expiresIn);
    } catch {
        return fail(event, 500, ['Failed to save the shortened URL. Please try again.']);
    }

    // Return the shortened URL and any validation errors
    return ok(event, {
        existing: false,
        message: 'Your shortened URL is ready:',
        slug,
        short: `${origin}/${slug}`,
        expiresAt: expiresIn ? Date.now() + expiresIn * 24 * 60 * 60 * 1000 : null
    });
});
