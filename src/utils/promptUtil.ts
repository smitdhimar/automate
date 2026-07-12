
export const generateResponsiveBanner = ( text: string ): string => {
  const width = Math.min(process.stdout.columns || 80, 120);
  const innerWidth = width - 4;

  const top = `╔${"═".repeat(innerWidth)}╗`;
  const middle = (text: string) => {
    const padded = ` ${text} `;
    const leftPad = Math.floor((innerWidth - padded.length) / 2);
    const rightPad = innerWidth - padded.length - leftPad;
    return `║${" ".repeat(leftPad)}${padded}${" ".repeat(rightPad)}║`;
  };
  const bottom = `╚${"═".repeat(innerWidth)}╝`;
  const empty = `║${" ".repeat(innerWidth)}║`;

  return `\n${top}\n${empty}\n${middle(`${text}`)}\n${empty}\n${bottom}\n`;
} ;