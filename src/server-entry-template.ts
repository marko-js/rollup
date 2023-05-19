export default (opts: {
  runtimeId?: string | null;
  manifestPath: string | false;
  templatePath: string;
  entryId: string;
}): string => {
  const templatePathStr = JSON.stringify(opts.templatePath);
  return `import template from ${templatePathStr};
export * from ${templatePathStr};
$ const markoGlobal = out.global;
${
  opts.runtimeId
    ? `$ markoGlobal.runtimeId = ${JSON.stringify(opts.runtimeId)};\n`
    : ""
}${
    opts.manifestPath
      ? `$ markoGlobal.__rollupManifest = ${JSON.stringify(
          opts.manifestPath
        )};\n`
      : ""
  }$ (markoGlobal.__rollupEntries || (markoGlobal.__rollupEntries = [])).push(${JSON.stringify(
    opts.entryId
  )});

<\${template} ...input/>
<init-components/>
<await-reorderer/>
`;
};
