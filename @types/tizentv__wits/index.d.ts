declare module '@tizentv/wits' {
    import { setWitsconfigInfo, start, watch } from '@tizentv/wits';

    export interface Wits {
        setWitsconfigInfo: (data: WitsconfigData) => void;
        start: () => void;
        watch: () => void;
    }

    type WitsconfigData = {
        width: string;
        deviceIp: string;
        socketPort: number;
        hostIp: string;
        isDebugMode: boolean;
        profileName: string;
        profilePath: string;
    };
}
