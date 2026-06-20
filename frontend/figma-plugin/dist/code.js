// src/code.ts
figma.showUI(__html__, { width: 420, height: 600 });
figma.ui.onmessage = (msg) => {
  if (msg.type === "notify") {
    figma.notify(msg.payload);
  }
  if (msg.type === "close") {
    figma.closePlugin();
  }
};
