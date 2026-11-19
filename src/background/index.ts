import { failure, isEnvelope, isPlaybackRequest, success, type Request, type Response } from "../shared/messages";
import { isSettings, normalizeSettings, SETTINGS_KEY, type Settings } from "../shared/settings";

async function route(request: Request): Promise<Response> {
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.id === undefined) return failure(request.requestId, "TAB_UNAVAILABLE");
  if (tab.url && !/^https?:\/\//.test(tab.url)) return failure(request.requestId, "PERMISSION_REQUIRED");
  const tabId = tab.id;
  const send = (documentId?: string) => chrome.tabs.sendMessage(
    tabId, request, documentId ? { documentId } : { frameId: 0 },
  );
  try {
    return await send();
  } catch {
    if (request.type !== "GET_STATE") return failure(request.requestId, "CONTENT_SCRIPT_UNAVAILABLE");
  }
  let documentId: string;
  try {
    const [injection] = await chrome.scripting.executeScript({ target: { tabId }, files: ["content.js"] });
    documentId = injection.documentId;
  } catch {
    return failure(request.requestId, "PERMISSION_REQUIRED");
  }
  try {
    return await send(documentId);
  } catch {
    return failure(request.requestId, "CONTENT_SCRIPT_UNAVAILABLE");
  }
}

chrome.runtime.onMessage.addListener((message: unknown, sender, reply: (response: Response | Response<Settings>) => void) => {
  if (sender.id !== chrome.runtime.id || !isEnvelope(message)) return;
  if (sender.url === chrome.runtime.getURL("settings.html") && sender.frameId === 0) {
    if (message.type !== "SAVE_SETTINGS" || !isSettings(message.payload)) {
      reply(failure(message.requestId, "INVALID_PAYLOAD"));
      return;
    }
    const settings = normalizeSettings(message.payload);
    void chrome.storage.local.set({ [SETTINGS_KEY]: settings }).then(
      () => reply(success(message.requestId, settings)),
      () => reply(failure(message.requestId, "COMMAND_FAILED")),
    );
    return true;
  }
  if (sender.id !== chrome.runtime.id || sender.tab || sender.url !== chrome.runtime.getURL("index.html")) return;
  if (!isPlaybackRequest(message)) {
    reply(failure(message.requestId, "INVALID_PAYLOAD"));
    return;
  }
  void route(message).then(reply, () => reply(failure(message.requestId, "COMMAND_FAILED")));
  return true;
});
