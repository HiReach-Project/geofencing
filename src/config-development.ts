import { Config } from "./models/config";

const configDev: Config = {
    port: 80,
    webPush: {
        privateKey: "",
        publicKey: "",
        mailTo: ""
    },
    firebase: {
        credential: {
            type: "",
            project_id: "",
            private_key_id: "",
            private_key: "",
            client_email: "",
            client_id: "",
            auth_uri: "",
            token_uri: "",
            auth_provider_x509_cert_url: "",
            client_x509_cert_url: ""
        },
        databaseUrl: ""
    },
    tileHost: 'tile'
};

export default configDev;
