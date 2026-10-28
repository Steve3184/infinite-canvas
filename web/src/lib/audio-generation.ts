import { modelOptionName, resolveModelForCapability, type AiConfig } from "@/stores/use-config-store";

export type AudioKind = "openai" | "azure" | "unreal" | "index";

export const audioVoiceOptions = [
    { value: "alloy", label: "Alloy" },
    { value: "ash", label: "Ash" },
    { value: "ballad", label: "Ballad" },
    { value: "coral", label: "Coral" },
    { value: "echo", label: "Echo" },
    { value: "fable", label: "Fable" },
    { value: "nova", label: "Nova" },
    { value: "onyx", label: "Onyx" },
    { value: "sage", label: "Sage" },
    { value: "shimmer", label: "Shimmer" },
    { value: "verse", label: "Verse" },
    { value: "marin", label: "Marin" },
    { value: "cedar", label: "Cedar" },
];

/** S3AI azure-tts accepts any Edge/Azure voice name; these are the common ones. */
const azureVoiceOptions = [
    { value: "zh-CN-XiaoxiaoNeural", label: "Xiaoxiao" },
    { value: "zh-CN-XiaoyiNeural", label: "Xiaoyi" },
    { value: "zh-CN-YunxiNeural", label: "Yunxi" },
    { value: "zh-CN-YunjianNeural", label: "Yunjian" },
    { value: "zh-CN-YunyangNeural", label: "Yunyang" },
    { value: "en-US-JennyNeural", label: "Jenny" },
    { value: "en-US-AriaNeural", label: "Aria" },
    { value: "en-US-GuyNeural", label: "Guy" },
    { value: "ja-JP-NanamiNeural", label: "Nanami" },
];

const unrealVoiceOptions = ["Mei", "Lian", "Ting", "Jing", "Wei", "Jian", "Hao", "Sheng", "Autumn", "Melody", "Hannah", "Emily", "Noah", "Jasper", "Caleb", "Ethan"].map((value) => ({ value, label: value }));

export const audioFormatOptions = [
    { value: "mp3", label: "MP3" },
    { value: "wav", label: "WAV" },
    { value: "opus", label: "Opus" },
    { value: "aac", label: "AAC" },
    { value: "flac", label: "FLAC" },
    { value: "pcm", label: "PCM" },
];

export function audioKind(model: string): AudioKind {
    const name = model.trim().toLowerCase();
    if (name.startsWith("azure-tts")) return "azure";
    if (name.startsWith("unreal-speech")) return "unreal";
    if (name.startsWith("indextts")) return "index";
    return "openai";
}

export function audioKindOf(config: AiConfig) {
    return audioKind(modelOptionName(resolveModelForCapability(config, config.model, "audio")));
}

export function audioVoiceOptionsOf(kind: AudioKind) {
    if (kind === "azure") return azureVoiceOptions;
    if (kind === "unreal") return unrealVoiceOptions;
    return kind === "index" ? [] : audioVoiceOptions;
}

/** azure-tts and unreal-speech-v8 return MP3, indextts-2 returns WAV. */
export function audioFormatOptionsOf(kind: AudioKind) {
    if (kind === "openai") return audioFormatOptions;
    return audioFormatOptions.filter((item) => item.value === (kind === "index" ? "wav" : "mp3"));
}

/** For indextts-2 the voice is a reference audio URL or Data URL; an empty result means it is missing. */
export function normalizeAudioVoiceValue(value: string, kind: AudioKind = "openai") {
    const voice = (value || "").trim();
    if (kind === "index") return /^(https?:|data:)/i.test(voice) ? voice : "";
    if (kind === "azure") return /Neural$/.test(voice) ? voice : azureVoiceOptions[0].value;
    if (kind === "unreal") return unrealVoiceOptions.some((item) => item.value === voice) ? voice : "Mei";
    return audioVoiceOptions.some((item) => item.value === voice) ? voice : "alloy";
}

export function normalizeAudioFormatValue(value: string, kind: AudioKind = "openai") {
    const options = audioFormatOptionsOf(kind);
    return options.some((item) => item.value === value) ? value : options[0].value;
}

export function normalizeAudioSpeedValue(value: string) {
    const speed = Number(value);
    if (!Number.isFinite(speed)) return "1";
    return String(Math.max(0.25, Math.min(4, Number(speed.toFixed(2)))));
}

export function audioVoiceLabel(value: string, kind: AudioKind = "openai") {
    const voice = normalizeAudioVoiceValue(value, kind);
    if (kind === "index") return voice ? "Reference" : "No reference";
    return audioVoiceOptionsOf(kind).find((item) => item.value === voice)?.label || voice;
}

export function audioFormatLabel(value: string, kind: AudioKind = "openai") {
    const format = normalizeAudioFormatValue(value, kind);
    return audioFormatOptions.find((item) => item.value === format)?.label || format;
}

export function audioSpeedLabel(value: string, kind: AudioKind = "openai") {
    return kind === "index" ? "—" : `${normalizeAudioSpeedValue(value)}x`;
}

export function audioMimeType(format: string) {
    if (format === "wav") return "audio/wav";
    if (format === "opus") return "audio/opus";
    if (format === "aac") return "audio/aac";
    if (format === "flac") return "audio/flac";
    if (format === "pcm") return "audio/pcm";
    return "audio/mpeg";
}
