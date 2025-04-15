use anchor_lang::prelude::*;

use crate::state::*;

#[derive(Accounts)]
#[instruction(new_description: MarkerDescription, position: Position)]
pub struct UpdateMarker<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        mut,
        realloc = crate::marker_entry_space!(new_description),
        realloc::payer = author,
        realloc::zero = false,
        seeds = [
            b"marker_entry",
            position.lat.to_le_bytes().as_ref(),
            position.lon.to_le_bytes().as_ref()
        ],
        bump,
        has_one = author
    )]
    pub marker_entry: Account<'info, MarkerEntry>,

    pub system_program: Program<'info, System>,
}

pub fn update_marker(
    ctx: Context<UpdateMarker>,
    new_description: MarkerDescription,
    _position: Position,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let marker = &mut ctx.accounts.marker_entry;

    // Write marker data
    marker.description = new_description;
    marker.updated_at = now;

    Ok(())
}
