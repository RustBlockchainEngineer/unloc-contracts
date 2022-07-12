// @ts-check
const path = require('path');
const programDir = path.join(__dirname, '..', '..', 'programs', 'unloc-voting');
const idlDir = path.join(__dirname, '..', '..', 'target', 'idl');
const sdkDir = path.join(__dirname, 'src');
const binaryInstallDir = path.join(__dirname, '..', '.crates');

module.exports = {
  idlGenerator: 'anchor',
  programName: 'unloc_voting',
  programId: '6z6RuFauTG511XRakJnPhxUTCVPohv6oC69xieMdm4Z9',
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};
