// @ts-check
const path = require('path');
const programDir = path.join(__dirname, '..', '..', 'programs', 'unloc-staking');
const idlDir = path.join(__dirname, '..', '..', 'target', 'idl');
const sdkDir = path.join(__dirname, 'src');
const binaryInstallDir = path.join(__dirname, '..', '.crates');

module.exports = {
  idlGenerator: 'anchor',
  programName: 'unloc_staking',
  programId: 'EmS3wD1UF9UhejugSrfUydMzWrCKBCxz4Dr1tBUsodfU',
  idlDir,
  sdkDir,
  binaryInstallDir,
  programDir,
};
