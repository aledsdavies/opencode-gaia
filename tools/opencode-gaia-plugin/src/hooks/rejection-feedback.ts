export function buildRejectionPrefill(toolName: string): string {
  const normalizedTool = toolName.trim();
  return `Rejected ${normalizedTool} because: `;
}
