import { ProgramError } from '@project-serum/anchor';
import _ from 'lodash';
import assert from 'assert';
import {IDL as stakingIDL} from '../src/types/unloc_staking'

export async function wrapError (fn) {
  try {
    if (typeof fn === 'function')
      await fn()
    else
      await fn
  } catch (error) {
    let translatedErr
    if (error instanceof ProgramError) {
      translatedErr = error
    } else {
      translatedErr = ProgramError.parse(error, parseIdlErrors(stakingIDL))
    }
    if (translatedErr === null) {
      throw error
    } else {
      console.log(`ErrCode=${translatedErr.code} msg=${translatedErr.msg}`)
    }
    throw translatedErr
  }
}

export async function assertError (fn, msg) {
  try {
    await wrapError(fn)
  } catch (error) {
    assert(error.msg === msg, `Expect ${msg} but got ${error.msg}`)
  }
}
function parseIdlErrors (idl) {
  const errors = new Map();
  if (idl.errors) {
    idl.errors.forEach((e) => {
      let msg = e.msg ?? e.name;
      errors.set(e.code, msg);
    });
  }
  return errors;
}
