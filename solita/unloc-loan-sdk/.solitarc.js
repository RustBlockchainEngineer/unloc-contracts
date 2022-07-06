// @ts-check
const path = require('path');
const programDir = path.join(__dirname, '..', '..', 'programs', 'unloc-loan');
const idlDir = path.join(__dirname, '..', '..', 'target', 'idl');
const sdkDir = path.join(__dirname, 'src');
const binaryInstallDir = path.join(__dirname, '..', '.crates');

module.exports = {
  idlGenerator: 'anchor',
  programName: 'unloc_loan',
  programId: '6oVXrGCdtnTUR6xCvn2Z3f2CYaiboAGar1DKxzeX8QYh',
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};
