use anchor_lang::prelude::*;

use anchor_spl::token_interface::{ Mint, TokenInterface};

use crate::MemeRatio;
use crate::OwnerCap;

#[derive(Accounts)]
pub struct Add<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mint::token_program = token_program
    )]
    pub mint_meme: InterfaceAccount<'info, Mint>,
    #[account(
        has_one = owner,
        seeds = [b"tbw_yaminogemu"],
        bump
    )]
    pub ownership: Account<'info, OwnerCap>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + MemeRatio::INIT_SPACE,
        seeds = [b"meme", mint_meme.key().as_ref()],
        bump
    )]
    pub meme_ratio: Account<'info, MemeRatio>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl Add<'_> {
    pub fn set_amount(&mut self, amount: u64) -> Result<()> {
        self.meme_ratio.set_inner( MemeRatio {
            mint_meme: self.mint_meme.key(),
            amount,
        });
        Ok(())
    }
}