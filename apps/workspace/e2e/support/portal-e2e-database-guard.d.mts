export interface PortalE2eEnvironment {
    development: Record<string, string>;
    databaseUrl: string;
    publishableKey: string;
    secretKey: string;
}

export function databaseIdentity(rawUrl: string): string;

export function loadPortalE2eEnvironment(
    appDirectory: string,
): PortalE2eEnvironment;
