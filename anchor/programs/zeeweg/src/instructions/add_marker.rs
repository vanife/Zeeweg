use anchor_lang::prelude::*;

use crate::{constants::*, state::*};

#[derive(Accounts)]
#[instruction(description: MarkerDescription, position: Position)]
pub struct AddMarker<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        init,
        payer = author,
        space = crate::marker_entry_space!(description),
        seeds = [
            b"marker_entry",
            position.lat.to_le_bytes().as_ref(),
            position.lon.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub marker_entry: Account<'info, MarkerEntry>,

    #[account(
        // NOTE: Using init_if_needed to avoid explicit init for chunks globaly, there’s no re-initialization risk
        init_if_needed,
        payer = author,
        space = crate::marker_tile_space!(MAX_MARKERS_IN_TILE),
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

pub fn add_marker(
    ctx: Context<AddMarker>,
    description: MarkerDescription,
    position: Position,
) -> Result<()> {
    let marker_entry = &mut ctx.accounts.marker_entry;
    let marker_tile = &mut ctx.accounts.marker_tile;
    let now = Clock::get()?.unix_timestamp;
    let tile = position.tile(TILE_RESOLUTION);

    // Write marker data
    marker_entry.author = ctx.accounts.author.key();
    marker_entry.description = description;
    marker_entry.position = position;
    marker_entry.created_at = now;
    marker_entry.updated_at = now;

    // Update chunk
    let marker_key = marker_entry.key();
    if !marker_tile.markers.contains(&marker_key) {
        marker_tile.markers.push(marker_key);
    }

    // Store tile info in chunk if first init
    if marker_tile.markers.len() == 1 {
        marker_tile.tile = tile;
    }

    Ok(())
}
