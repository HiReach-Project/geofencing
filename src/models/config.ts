export interface Config {
    port: number;
    webPush?: {
        privateKey: string;
        publicKey: string;
        mailTo: string;
    };
    firebase?: {
        credential: { [key: string]: string };
        databaseUrl: string;
    }
    tileHost: string;
}
