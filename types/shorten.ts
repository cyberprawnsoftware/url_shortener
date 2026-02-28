/*
* Single type file for all app interfaces, no point splitting them up for this demonstration
* */

export interface ShortenResult {
    existing: boolean;
    slug: string;
    short: string;
    message: string;
    expiresAt: number | null;
}

export interface ShortenResponseField {
    key: string;
    message: string;
}

export interface ShortenResponse {
    success: boolean;
    existing?: boolean;
    slug?: string;
    short?: string;
    errors?: string[];
    fields?: ShortenResponseField[];
    message?: string;
    expiresAt?: number | null;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    fields: ShortenResponseField[];
}

export interface StoredUrl {
    url: string;
    clicks: number;
    createdAt: number;
    expiresAt: number | null;
}

export interface Context {
    url: unknown;
    origin: string;
    parsed?: URL;
}

export interface Rule {
    test: (context: Context) => boolean | Promise<boolean>;
    error: string;
    fieldMessage: string;
    fail?: boolean;
}
