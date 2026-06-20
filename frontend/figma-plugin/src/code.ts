figma.showUI(__html__, { width: 420, height: 600 })

figma.ui.onmessage = (msg: { type: string; payload?: unknown }) => {
  if (msg.type === "notify") {
    figma.notify(msg.payload as string)
  }
  if (msg.type === "close") {
    figma.closePlugin()
  }
}
