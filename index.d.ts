export declare function setWitsconfigInfo(data: WitsconfigData): void;
export declare function start(): void;
export declare function watch(): void;

declare global {
    type WitsconfigData = {
        width: string;
        deviceIp: string;
        socketPort: number;
        hostIp: string;
        isDebugMode: boolean;
        profileName: string;
        profilePath: string;
    }
}