const vibrateOnWeb = () => {

    if (
        typeof navigator !== "undefined" &&
        typeof navigator.vibrate === "function"
    ) {
        navigator.vibrate(12);
    }

};


export const triggerLightHaptic = () => {

    try {

        const nativeHaptics =
            globalThis.Capacitor
                ?.Plugins
                ?.Haptics;


        if (
            nativeHaptics &&
            typeof nativeHaptics.impact === "function"
        ) {

            Promise.resolve(
                nativeHaptics.impact({
                    style: "LIGHT"
                })
            ).catch(vibrateOnWeb);

            return;

        }

    }

    catch {
        // Fall through to the browser vibration API.
    }


    vibrateOnWeb();

};
