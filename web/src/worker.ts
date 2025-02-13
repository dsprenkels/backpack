import { BLTWarning, BringList, getBLTWarnings, parseBLTChecked } from "./filterspec";

type MessageEventData = string
interface MessagePostData {
    compileResult: BringList | Error,
    warnings: BLTWarning[],
}

onmessage = (event: MessageEvent<MessageEventData>) => {
    const btlString = event.data;
    const compileResult = parseBLTChecked(btlString);
    const warnings = !(compileResult instanceof Error) ? getBLTWarnings(compileResult) : [];
    const workerResult: MessagePostData = { compileResult, warnings }
    postMessage(workerResult);
};
