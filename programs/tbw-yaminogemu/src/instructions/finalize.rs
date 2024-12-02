use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{close_account, transfer_checked, Mint, TokenAccount, TokenInterface, CloseAccount, TransferChecked},
};

use crate::Escrow;
use crate::error::ErrorCode;

#[derive(Accounts)]
pub struct Finalize<'info> {
    #[account(mut)]
    pub winner: Signer<'info>,
    #[account(mut)]
    pub maker: SystemAccount<'info>,
    pub mint_win: InterfaceAccount<'info, Mint>,
    pub mint_lose: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint = mint_win,
        associated_token::authority = winner,
        associated_token::token_program = token_program,
    )]
    pub winner_ata_win: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        init_if_needed,
        payer = winner,
        associated_token::mint = mint_lose,
        associated_token::authority = winner,
        associated_token::token_program = token_program,
    )]
    pub winner_ata_lose: Box<InterfaceAccount<'info, TokenAccount>>,
    #[account(
        mut,
        close = winner,
        has_one = maker,
        seeds = [b"escrow", maker.key().as_ref(), escrow.task_id.to_le_bytes().as_ref()],
        bump = escrow.bump
    )]
    escrow: Box<Account<'info, Escrow>>,
    #[account(
        mut,
        associated_token::mint = mint_win,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub vault_win: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = mint_lose,
        associated_token::authority = escrow,
        associated_token::token_program = token_program,
    )]
    pub vault_lose: InterfaceAccount<'info, TokenAccount>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

impl Finalize<'_> {
    pub fn send_and_close_vault(&mut self) -> Result<()> {
        require!(self.escrow.filled == true, ErrorCode::NotFilledError);
        let signer_seeds: [&[&[u8]]; 1] = [&[
            b"escrow",
            self.maker.to_account_info().key.as_ref(),
            &self.escrow.task_id.to_le_bytes()[..],
            &[self.escrow.bump],
        ]];

        let accounts_a = TransferChecked {
            from: self.vault_win.to_account_info(),
            mint: self.mint_win.to_account_info(),
            to: self.winner_ata_win.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let ctx_a = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts_a,
            &signer_seeds,
        );

        transfer_checked(ctx_a, self.vault_win.amount, self.mint_win.decimals)?;

        let accounts_b = TransferChecked {
            from: self.vault_lose.to_account_info(),
            mint: self.mint_lose.to_account_info(),
            to: self.winner_ata_lose.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let ctx_b = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts_b,
            &signer_seeds,
        );

        transfer_checked(ctx_b, self.vault_lose.amount, self.mint_lose.decimals)?;

        let accounts_win = CloseAccount {
            account: self.vault_win.to_account_info(),
            destination: self.winner.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let ctx_win = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts_win,
            &signer_seeds,
        );

        close_account(ctx_win)?;

        let accounts_lose = CloseAccount {
            account: self.vault_lose.to_account_info(),
            destination: self.winner.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let ctx_lose = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            accounts_lose,
            &signer_seeds,
        );

        close_account(ctx_lose)
    }
}