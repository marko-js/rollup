export default (opts: {
  runtimeId?: string;
  manifestPath: string | false;
  templatePath: string;
  entryId: string;
}): string => {
  const templatePathStr = JSON.stringify(opts.templatePath);
  return `import template from ${templatePathStr};
export * from ${templatePathStr};
$ const $global = out.global;
${
  opts.runtimeId
    ? `$ $global.runtimeId = ${JSON.stringify(opts.runtimeId)};\n`
    : ""
}${
    opts.manifestPath
      ? `$ $global.__rollupManifest = ${JSON.stringify(opts.manifestPath)};\n`
      : ""
  }$ ($global.__rollupEntries || ($global.__rollupEntries = [])).push(${JSON.stringify(
    opts.entryId
  )});

<\${template} ...input/>
<init-components/>
<await-reorderer/>
`;
};
