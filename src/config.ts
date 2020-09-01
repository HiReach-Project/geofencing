import configProd from "./config-production";
import configDev from "./config-development";
import { CustomConfig } from "./models/custom-config";
import { Config } from "./models/config";

const customConfig: CustomConfig = {
    timeTableErrorMinutes: 10,
    offFenceAreaNotificationIntervalMiutes: 3,
    fenceNearbyRetry: 5,
    fenceAreaBorderMeters: 50,
    fenceAreaBetweenPointsMeters: 20,
    customAreaRadiusMeters: 30,
    notifyMessageLanguage: 'en',
    targetName: '',
}

let configs = {
    production: configProd,
    development: configDev
}

const config = configs[process.env.env] as Config;

export { config, customConfig };
