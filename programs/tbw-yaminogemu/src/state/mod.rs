use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub task_id: u64,
    pub maker: Pubkey,
    pub mint_a: Pubkey,
    pub bonk_amount: u64,
    pub filled: bool,
    pub bump: u8,
}
#[account]
#[derive(InitSpace)]
pub struct MemeRatio {
    pub mint_meme: Pubkey,
    pub amount: u64, 
}

#[account]
#[derive(InitSpace)]
pub struct OwnerCap {
    pub owner: Pubkey,
}