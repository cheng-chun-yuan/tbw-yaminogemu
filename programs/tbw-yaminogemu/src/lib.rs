pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("F3WVtr1yzW5dsYPLSvBKqF4LwD48YbcXYDjG74TxBFL6");

#[program]
pub mod tbw_yaminogemu {
    use super::*;

    pub fn init(ctx: Context<Init>) -> Result<()> {
        ctx.accounts.init()
    }

    pub fn add(ctx: Context<Add>, amount: u64) -> Result<()> {
        ctx.accounts.set_amount(amount)
    }

    pub fn create(ctx: Context<Create>, task_id: u64, bonk_amount: u64) -> Result<()> {
        ctx.accounts.deposit()?;
        ctx.accounts.create_task(task_id, bonk_amount, &ctx.bumps)
    }

    pub fn refund(ctx: Context<Refund>) -> Result<()> {
        ctx.accounts.refund_and_close_vault()
    }

    // pub fn take(ctx: Context<Take>) -> Result<()> {
    //     ctx.accounts.deposit()?;
    //     ctx.accounts.withdraw_and_close_vault()
    // }
}
