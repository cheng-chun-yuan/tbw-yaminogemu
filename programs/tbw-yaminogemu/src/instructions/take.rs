use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::Escrow;
use crate::MemeRatio;

#[derive(Accounts)]
pub struct Take<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    pub mint_meme: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_meme,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_ata_b: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        has_one = mint_meme,
        seeds = [b"meme", mint_meme.key().as_ref()],
        bump
    )]
    pub meme_ratio: Account<'info, MemeRatio>,
    #[account(
        mut,
        has_one = maker,
        seeds = [b"escrow", maker.key().as_ref(), escrow.task_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    escrow: Box<Account<'info, Escrow>>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint_meme,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub vault_b: Box<InterfaceAccount<'info, TokenAccount>>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl Take<'_> {
    pub fn deposit(&mut self) -> Result<()> {
        let amount = self.escrow.bonk_amount * self.meme_ratio.amount;
        let transfer_accounts = TransferChecked {
            from: self.taker_ata_b.to_account_info(),
            mint: self.mint_meme.to_account_info(),
            to: self.vault_b.to_account_info(),
            authority: self.taker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), transfer_accounts);

        self.escrow.filled = true;

        transfer_checked(cpi_ctx, amount, self.mint_meme.decimals)
    }

}