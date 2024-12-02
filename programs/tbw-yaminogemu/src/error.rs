use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,
    #[msg("Already filled, can not withdraw")]
    AlreadyFilledError,
    #[msg("Not filled, can not withdraw")]
    NotFilledError,
}
