import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import markUrl from "../../../assets/images/brand/hospodar-yki-mark.svg";
import { App } from "./App.tsx";
import { createLearnerRepository } from "./storage/learnerRepository.ts";
import { createExamRepository } from "./storage/examRepository.ts";
import "./styles.css";

const icon = document.createElement("link");
icon.rel = "icon"; icon.type = "image/svg+xml"; icon.href = markUrl;
document.head.append(icon);

createRoot(document.getElementById("root")!).render(
  <StrictMode><App repository={createLearnerRepository()} examRepository={createExamRepository()} markUrl={markUrl} /></StrictMode>,
);
