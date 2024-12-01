import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { TbwYaminogemu } from "../target/types/tbw_yaminogemu";

import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_2022_PROGRAM_ID,
  createAssociatedTokenAccountIdempotentInstruction,
  createInitializeMint2Instruction,
  createMintToInstruction,
  getAssociatedTokenAddressSync,
  getMinimumBalanceForRentExemptMint,
} from "@solana/spl-token";
import { randomBytes } from "crypto";

describe("tbw_yaminogemu", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const provider = anchor.getProvider();

  const connection = provider.connection;

  const program = anchor.workspace.TbwYaminogemu as Program<TbwYaminogemu>;

  const tokenProgram = TOKEN_2022_PROGRAM_ID;
  // const tokenProgram = TOKEN_PROGRAM_ID;

  const confirm = async (signature: string): Promise<string> => {
    const block = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...block,
    });
    return signature;
  };

  const log = async (signature: string): Promise<string> => {
    console.log(
      `Your transaction signature: https://explorer.solana.com/transaction/${signature}?cluster=devnet`
    );
    return signature;
  };

  const task_id = new BN(randomBytes(8));

  const [maker, taker, mintA, mintB] = Array.from({ length: 4 }, () =>
    Keypair.generate()
  );

  const [makerAtaA, makerAtaB, takerAtaA, takerAtaB] = [maker, taker]
    .map((a) =>
      [mintA, mintB].map((m) =>
        getAssociatedTokenAddressSync(m.publicKey, a.publicKey, false, tokenProgram)
      )
    )
    .flat();

  const escrow = PublicKey.findProgramAddressSync(
    [Buffer.from("escrow"), maker.publicKey.toBuffer(), task_id.toArrayLike(Buffer, "le", 8)],
    program.programId
  )[0];

  const memeRatio = PublicKey.findProgramAddressSync(
    [Buffer.from("meme"), mintA.publicKey.toBuffer()],
    program.programId
  )[0];
  console.log(memeRatio.toBase58())

  const vault = getAssociatedTokenAddressSync(mintA.publicKey, escrow, true, tokenProgram);

  // Accounts
  const accounts = {
    owner: maker.publicKey,
    maker: maker.publicKey,
    taker: taker.publicKey,
    mintMeme: mintA.publicKey,
    mintA: mintA.publicKey,
    mintB: mintB.publicKey,
    memeRatio,
    makerAtaA,
    makerAtaB,
    takerAtaA,
    takerAtaB,
    escrow,
    vault,
    tokenProgram,
  }

  it("Airdrop and create mints", async () => {
    let lamports = await getMinimumBalanceForRentExemptMint(connection);
    let tx = new Transaction();
    tx.instructions = [
      ...[maker, taker].map((account) =>
        SystemProgram.transfer({
          fromPubkey: provider.publicKey,
          toPubkey: account.publicKey,
          lamports: 10 * LAMPORTS_PER_SOL,
        })
      ),
      ...[mintA, mintB].map((mint) =>
        SystemProgram.createAccount({
          fromPubkey: provider.publicKey,
          newAccountPubkey: mint.publicKey,
          lamports,
          space: MINT_SIZE,
          programId: tokenProgram,
        })
      ),
      ...[
        { mint: mintA.publicKey, authority: maker.publicKey, ata: makerAtaA },
        { mint: mintB.publicKey, authority: taker.publicKey, ata: takerAtaB },
      ]
      .flatMap((x) => [
        createInitializeMint2Instruction(x.mint, 6, x.authority, null, tokenProgram),
        createAssociatedTokenAccountIdempotentInstruction(provider.publicKey, x.ata, x.authority, x.mint, tokenProgram),
        createMintToInstruction(x.mint, x.ata, x.authority, 1e9, undefined, tokenProgram),
      ])
    ];

    await provider.sendAndConfirm(tx, [mintA, mintB, maker, taker]).then(log);
  });

  it("Init", async () => {
    await program.methods
      .init()
      .accounts({ ...accounts })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Add", async () => {
    await program.methods
      .add(new BN(1))
      .accounts({ ...accounts })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Create", async () => {
    await program.methods
      .create(task_id, new BN(1e6))
      .accounts({ ...accounts })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Refund", async () => {
    await program.methods
      .refund()
      .accounts({ ...accounts })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  // it("Take", async () => {
  //   try {
  //   await program.methods
  //     .take()
  //     .accounts({  ...accounts })
  //     .signers([taker])
  //     .rpc()
  //     .then(confirm)
  //     .then(log);
  //   } catch(e) {
  //     console.log(e);
  //     throw(e)
  //   }
  // });
});
