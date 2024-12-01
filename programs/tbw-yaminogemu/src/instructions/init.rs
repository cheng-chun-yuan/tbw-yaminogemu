use anchor_lang::prelude::*;

use anchor_spl::token_interface::TokenInterface;

use crate::MemeRatio;
use crate::OwnerCap;

#[derive(Accounts)]
pub struct Init<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + MemeRatio::INIT_SPACE,
        seeds = [b"tbw_yaminogemu"],
        bump
    )]
    pub ownership: Account<'info, OwnerCap>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl Init<'_> {
    pub fn init(&mut self) -> Result<()> {
        self.ownership.set_inner( OwnerCap {
            owner: self.owner.key(),
        });
        Ok(())
    }
}