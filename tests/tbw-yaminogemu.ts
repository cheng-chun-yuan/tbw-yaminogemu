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
  ASSOCIATED_TOKEN_PROGRAM_ID,
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

  const ownership = PublicKey.findProgramAddressSync(
    [Buffer.from("tbw_yaminogemu")],
    program.programId
  )[0];

  const memeRatioA = PublicKey.findProgramAddressSync(
    [Buffer.from("meme"), mintA.publicKey.toBuffer()],
    program.programId
  )[0];

  const memeRatioB = PublicKey.findProgramAddressSync(
    [Buffer.from("meme"), mintB.publicKey.toBuffer()],
    program.programId
  )[0];

  const vaultA = getAssociatedTokenAddressSync(mintA.publicKey, escrow, true, tokenProgram);
  const vaultB = getAssociatedTokenAddressSync(mintB.publicKey, escrow, true, tokenProgram);
  // Accounts
  const accounts = {
    owner: maker.publicKey,
    maker: maker.publicKey,
    taker: taker.publicKey,
    mintA: mintA.publicKey,
    mintB: mintB.publicKey,
    memeRatioA,
    memeRatioB,
    makerAtaA,
    makerAtaB,
    takerAtaA,
    takerAtaB,
    escrow,
    vaultA,
    vaultB,
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
          lamports: 0.01 * LAMPORTS_PER_SOL,
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
        createMintToInstruction(x.mint, x.ata, x.authority, 3e9, undefined, tokenProgram),
      ])
    ];

    await provider.sendAndConfirm(tx, [mintA, mintB, maker, taker]).then(log);
  });

  it("Init", async () => {
    await program.methods
      .init()
      .accountsStrict({
        owner: maker.publicKey,
        ownership,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Add", async () => {
    await program.methods
      .add(new BN(3))
      .accountsStrict({
        owner: maker.publicKey,
        mintMeme: mintA.publicKey,
        ownership,
        memeRatio: memeRatioA,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Add", async () => {
    await program.methods
      .add(new BN(2))
      .accountsStrict({
        owner: maker.publicKey,
        mintMeme: mintB.publicKey,
        ownership,
        memeRatio: memeRatioB,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Create", async () => {
    await program.methods
      .create(task_id, new BN(1e6))
      .accountsStrict({
        maker: maker.publicKey,
        mintA: mintA.publicKey,
        makerAtaA,
        memeRatio: memeRatioA,
        escrow,
        vaultA,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  xit("Refund", async () => {
    await program.methods
      .refund()
      .accountsStrict({
        maker: maker.publicKey,
        mintA: mintA.publicKey,
        makerAtaA,
        escrow,
        vaultA,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([maker])
      .rpc()
      .then(confirm)
      .then(log);
  });

  it("Take", async () => {
    try {
    await program.methods
      .take()
      .accountsStrict({ 
        taker: taker.publicKey,
        maker: maker.publicKey,
        mintMeme: mintB.publicKey,
        takerAtaB,
        memeRatio: memeRatioB,
        escrow,
        vaultB,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log);
    } catch(e) {
      console.log(e);
      throw(e)
    }
  });

  it("Finalize", async () => {
    try {
    await program.methods
      .finalize()
      .accountsStrict({ 
        winner: taker.publicKey,
        maker: maker.publicKey,
        mintWin: mintB.publicKey,
        mintLose: mintA.publicKey,
        winnerAtaWin: takerAtaB,
        winnerAtaLose: takerAtaA,
        escrow,
        vaultWin: vaultB,
        vaultLose: vaultA,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([taker])
      .rpc()
      .then(confirm)
      .then(log);
    } catch(e) {
      console.log(e);
      throw(e)
    }
  });
});
