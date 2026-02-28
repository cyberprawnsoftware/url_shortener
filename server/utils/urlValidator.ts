/*
* URL validation logic, following a rule-based system. Instead of bulky 'if' chaining, errors
* are collected and returned as an array which is then displayed in the form-error component
* */

import type { Context, Rule, ValidationResult } from '~/types/shorten';

/*
* Check to see if a URL actually exists by making a HEAD request, and if that fails, try a GET request.
* We don't want to be saving URLs that don't exist, so we'll just return false if the HEAD request fails
* */
async function urlExists(url: string): Promise<boolean> {
    try {
        let response = await fetch(url, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000)
        });

        if (response.status === 405) {
            response = await fetch(url, {
                method: 'GET',
                signal: AbortSignal.timeout(5000)
            });
        }

        return response.ok;
    } catch {
        return false;
    }
}

/*
* Rule runner - still about as performant as 'if' chaining, but at least it's readable
* */
async function runRules(rules: Rule[], context: Context): Promise<ValidationResult> {
    const errors: string[] = [];
    const fields: { key: string; message: string }[] = [];

    for (const rule of rules) {
        const passed = await rule.test(context);

        if (!passed) {
            errors.push(rule.error);
            fields.push({ key: 'url', message: rule.fieldMessage });

            if (rule.fail) {
                break;
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        fields
    };
}

/*
* It was first considered to enforce the inclusion of the protocol segment at input.
* however, the decision was made to normalise the URL to include the https:// as standard protocol,
* as users may paste in a URL without. Better UX
* */
export function normaliseUrl(url: string): string {
    if (!/^https?:\/\//i.test(url)) {
        return `https://${url}`;
    }
    return url;
}

/*
* Validation entry point. Define the rules in an easily extendable way (SOLID (O) principle)
* */
export async function validateUrl(url: unknown, origin: string): Promise<ValidationResult> {
    const context: Context = { url, origin };

    const rules: Rule[] = [
        {
            test: context => !!context.url,
            error: 'The url field is required.',
            fieldMessage: 'This field is required.',
            fail: true
        },
        {
            test: context => typeof context.url === 'string',
            error: 'The url field must be a string.',
            fieldMessage: 'Must be a string.',
            fail: true
        },
        {
            test: context => (context.url as string).length <= 2048,
            error: 'The URL is too long.',
            fieldMessage: 'Must be 2048 characters or less.'
        },
        {
            test: context => {
                if (!URL.canParse(context.url as string)) return false;
                context.parsed = new URL(context.url as string);
                return true;
            },
            error: 'The provided URL is not valid.',
            fieldMessage: 'Must be a valid URL (e.g. https://example.com).',
            fail: true
        },
        {
            test: context => ['http:', 'https:'].includes(context.parsed!.protocol),
            error: 'Only http and https URLs are allowed.',
            fieldMessage: 'Protocol must be http or https.'
        },
        {
            test: context => context.parsed!.hostname.includes('.'),
            error: 'The URL must have a valid hostname.',
            fieldMessage: 'Hostname must contain a valid domain (e.g. example.com).'
        },
        {
            test: context => !['localhost', '127.0.0.1'].includes(context.parsed!.hostname),
            error: 'Localhost URLs are not allowed.',
            fieldMessage: 'Cannot shorten localhost URLs.'
        },
        {
            test: context => !(context.url as string).startsWith(context.origin),
            error: 'You cannot shorten a URL that points to this service.',
            fieldMessage: 'Self-referencing URLs are not allowed.'
        },
        {
            test: async context => {
                if (!context.parsed) return true;
                return await urlExists(context.url as string);
            },
            error: 'The provided URL does not appear to be reachable.',
            fieldMessage: 'This URL could not be reached. Please check it and try again.'
        }
    ];

    return runRules(rules, context);
}
