use anchor_lang::prelude::*;

use crate::{constants::*, state::*};

#[derive(Accounts)]
#[instruction(position: Position)]
pub struct DeleteMarker<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        mut,
        seeds = [
            b"marker_entry",
            position.lat.to_le_bytes().as_ref(),
            position.lon.to_le_bytes().as_ref()
        ],
        bump,
        has_one = author,
        close = author
    )]
    pub marker_entry: Account<'info, MarkerEntry>,

    #[account(
        mut,
        seeds = [
            b"marker_tile",
            position.tile(TILE_RESOLUTION).x.to_le_bytes().as_ref(),
            position.tile(TILE_RESOLUTION).y.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub marker_tile: Account<'info, MarkerTile>,

    pub system_program: Program<'info, System>,
}

pub fn delete_marker(ctx: Context<DeleteMarker>, _position: Position) -> Result<()> {
    let marker_tile = &mut ctx.accounts.marker_tile;
    let marker_entry_key = ctx.accounts.marker_entry.key();

    // Remove marker from tile
    marker_tile.markers.retain(|key| key != &marker_entry_key);

    // marker_entry is closed automatically by #[account(close = author)]
    Ok(())
}
