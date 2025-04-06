use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("This tile chunk is full")]
    ChunkFull,
}
