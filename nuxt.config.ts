import { process } from 'std-env';
import { getUrlStorageConfig } from './server/utils/getUrlStorageConfig';

const isDev = process.env.ENVIRONMENT === 'dev';

export default defineNuxtConfig({
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap'
        }
      ]
    }
  },

  compatibilityDate: '2026-02-27',

  css: ['~/assets/scss/styles.scss'],

  runtimeConfig: {
    public: {
      ENVIRONMENT: process.env.ENVIRONMENT,
      DEBUG: process.env.DEBUG,
      APP_ROOT: process.env.APP_ROOT,
    },
  },

  devtools: {
    enabled: process.env.DEBUG === 'true',

    timeline: {
      enabled: process.env.DEBUG === 'true',
    },
  },

  nitro: {
    prerender: {
      crawlLinks: false
    },
    storage: {
      urls: getUrlStorageConfig(isDev),
    },
    devStorage: {
      urls: getUrlStorageConfig(isDev),
    },
  }
});
