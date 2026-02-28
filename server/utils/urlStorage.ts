/*
* Server util designed as a storage interface, following a CRUD-like pattern for getting and setting URLS.
* This design was chose to allow app specific interfacing with Unstorage.
* Uses Nuxt native this.storage to store the data, which is a wrapper around redis or fs.
* */

import { useStorage } from '#imports';
import type { StoredUrl } from '~/types/shorten';

export class UrlStorage {
    private storage = useStorage('urls');

    async findSlugByUrl(url: string): Promise<string | null> {
        return await this.storage.getItem<string>(`url:${url}`);
    }

    async findUrlBySlug(slug: string): Promise<StoredUrl | null> {
        return await this.storage.getItem<StoredUrl>(`slug:${slug}`);
    }

    async slugExists(slug: string): Promise<boolean> {
        return await this.storage.hasItem(`slug:${slug}`);
    }

    async save(slug: string, url: string, ttlDays: number | null = null): Promise<void> {
        /*
        * When using redis, TTL handles expiry and cleanup automatically; isExpired is just a safety net
        * WHen using fs, TTL is ignored, isExpired is the only mechanism, and you need to manually 'delete' to clean up expired entries
        * */
        const now = Date.now();
        const expiresAt = ttlDays ? now + ttlDays * 24 * 60 * 60 * 1000 : null;

        const entry: StoredUrl = {
            url,
            clicks: 0,
            createdAt: now,
            expiresAt
        };

        const ttlSeconds = ttlDays ? ttlDays * 24 * 60 * 60 : undefined;

        await this.storage.setItem(`slug:${slug}`, entry, { ttl: ttlSeconds });
        await this.storage.setItem(`url:${url}`, slug, { ttl: ttlSeconds });
    }

    async delete(slug: string, url: string): Promise<void> {
        await this.storage.removeItem(`slug:${slug}`);
        await this.storage.removeItem(`url:${url}`);
    }

    async incrementClicks(slug: string): Promise<void> {
        const entry = await this.findUrlBySlug(slug);

        if (!entry) return;

        await this.storage.setItem(`slug:${slug}`, {
            ...entry,
            clicks: entry.clicks + 1
        });
    }

    async isExpired(entry: StoredUrl): Promise<boolean> {
        if (!entry.expiresAt) return false;
        return Date.now() > entry.expiresAt;
    }
}

// Export singleton instance
let instance: UrlStorage | null = null;

export function getUrlStorage(): UrlStorage {
    if (!instance) {
        instance = new UrlStorage();
    }
    return instance;
}
