import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import markUrl from "../../../assets/images/brand/hospodar-yki-mark.svg";
import { App } from "./App.tsx";
import { createLearnerRepository } from "./storage/learnerRepository.ts";
import { createExamRepository } from "./storage/examRepository.ts";
import { createVoiceStore } from "./storage/voiceStore.ts";
import "./styles.css";
import { registerServiceWorker } from "./pwa/offline.ts";

const icon = document.createElement("link");
icon.rel = "icon"; icon.type = "image/svg+xml"; icon.href = markUrl;
document.head.append(icon);

createRoot(document.getElementById("root")!).render(
  <StrictMode><App repository={createLearnerRepository()} examRepository={createExamRepository()} voiceStore={createVoiceStore()} markUrl={markUrl} /></StrictMode>,
);

void registerServiceWorker();
