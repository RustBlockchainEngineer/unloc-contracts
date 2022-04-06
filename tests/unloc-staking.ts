import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { UnlocStaking } from "../target/types/unloc_staking";

describe("unloc-staking", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.Provider.env());

  const program = anchor.workspace.UnlocStaking as Program<UnlocStaking>;

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.rpc.initialize({});
    console.log("Your transaction signature", tx);
  });
});
