import {
    Capacitor
} from "@capacitor/core";

import {
    Haptics,
    ImpactStyle
} from "@capacitor/haptics";


const vibrateOnWeb = () => {

    if (
        typeof navigator !== "undefined" &&
        typeof navigator.vibrate === "function"
    ) {
        navigator.vibrate(12);
    }

};


export const triggerLightHaptic = () => {

    if (Capacitor.isNativePlatform()) {

        Haptics.impact({
            style: ImpactStyle.Light
        }).catch(vibrateOnWeb);

        return;

    }


    vibrateOnWeb();

};
