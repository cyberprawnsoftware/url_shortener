/*
* Server util to set up the storage driver and config to be used by Nuxt's native Unstorage instance
* getUrlStorageConfig() is used in nuxt.config.ts in the nitro server config
*
* Uses fs for local development and redis for production
*
* fs was chosen for local development because it's easy to set up and doesn't require any additional dependencies
* redis is chosen for production because it's more performant and can scale
* */


const DEFAULT_STORAGE_BASE_PATH = './data/urls';

export type StorageDriver = 'fs' | 'redis';

/*
* returns the storage driver to use based on the environment variable
* */
export function getStorageDriver(): StorageDriver {
    return (process.env.STORAGE_DRIVER || 'fs') as StorageDriver;
}

/*
* Returns the config for the Unstorage instance based on the storage driver
* */
export function getUrlStorageConfig(isDev: boolean = false) {
    // Just return the default config if we're not in dev mode
    if (isDev) {
        return {
            driver: 'fs',
            base: process.env.DEV_STORAGE_BASE_PATH || DEFAULT_STORAGE_BASE_PATH
        };
    }

    const driver = getStorageDriver();

    switch (driver) {
        case 'redis':
            const url = process.env.REDIS_URL;
            if (!url) {
                throw new Error('REDIS_URL must be set when STORAGE_DRIVER=redis');
            }
            return { driver, url };

        case 'fs':
        default:
            return {
                driver: 'fs',
                base: process.env.STORAGE_BASE_PATH || DEFAULT_STORAGE_BASE_PATH
            };
    }
}
