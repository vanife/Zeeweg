use anchor_lang::prelude::*;

use crate::{marker_space, state::*};

#[derive(Accounts)]
#[instruction(marker: MarkerData)]
pub struct AddMarker<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        init,
        payer = author,
        space = marker_space!(marker),
        seeds = [b"marker",marker.position.seed().as_ref()],
        bump
    )]
    pub marker_account: Account<'info, MarkerAccount>,
    pub system_program: Program<'info, System>,
}

pub fn add_marker(ctx: Context<AddMarker>, marker: MarkerData) -> Result<()> {
    let account = &mut ctx.accounts.marker_account;

    account.author = ctx.accounts.author.key();
    account.data = marker;

    let now = Clock::get()?.unix_timestamp;
    account.created_at = now;
    account.updated_at = now;

    Ok(())
}
