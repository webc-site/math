export default function mdMath(
  md: string,
  compile: (tex: string, block?: boolean) => string,
): string;
