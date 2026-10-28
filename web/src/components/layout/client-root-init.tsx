import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { App } from "antd";
import { useTranslation } from "react-i18next";

import { fetchChannelModels } from "@/services/api/image";
import { useConfigStore } from "@/stores/use-config-store";
import { usePromptSourceScheduler } from "@/hooks/use-prompt-source-scheduler";

export function ClientRootInit({ children }: { children: ReactNode }) {
    const { message } = App.useApp();
    const { t } = useTranslation();
    const handledConfigParams = useRef(false);
    const importChannelCredentials = useConfigStore((state) => state.importChannelCredentials);
    const openConfigDialog = useConfigStore((state) => state.openConfigDialog);
    const setDefaultChannel = useConfigStore((state) => state.setDefaultChannel);

    usePromptSourceScheduler();

    useEffect(() => {
        if (handledConfigParams.current) return;
        const searchParams = new URLSearchParams(window.location.search);
        const baseUrl = searchParams.get("baseUrl") || searchParams.get("baseurl");
        const apiKey = searchParams.get("apiKey") || searchParams.get("apikey");
        if (!baseUrl && !apiKey) return;
        handledConfigParams.current = true;
        searchParams.delete("baseUrl");
        searchParams.delete("baseurl");
        searchParams.delete("apiKey");
        searchParams.delete("apikey");
        window.history.replaceState(null, "", `${window.location.pathname}${searchParams.size ? `?${searchParams}` : ""}${window.location.hash}`);
        const result = importChannelCredentials({ baseUrl, apiKey });
        openConfigDialog(false, "channels");
        if (result.status === "created") message.success(t("config.importedChannelCreated", { name: result.channelName }));
        else if (result.status === "updated") message.success(t("config.importedChannelUpdated", { name: result.channelName }));
        else if (result.status === "missing-base-url") message.error(t("config.importedChannelBaseUrlRequired"));
        else message.error(t("config.importedChannelBaseUrlInvalid"));
        const channel = useConfigStore.getState().config.channels.find((item) => item.id === result.channelId);
        if (!channel) return;
        if (!channel.apiKey.trim()) {
            setDefaultChannel(channel.id, []);
            return;
        }
        fetchChannelModels(channel)
            .then((names) => {
                setDefaultChannel(channel.id, names);
                message.success(t("config.importedChannelModelsLoaded", { count: names.length }));
            })
            .catch((error) => {
                setDefaultChannel(channel.id, []);
                message.error(t("config.importedChannelModelsFailed", { message: error instanceof Error ? error.message : String(error) }));
            });
    }, [importChannelCredentials, message, openConfigDialog, setDefaultChannel, t]);

    return <>{children}</>;
}
