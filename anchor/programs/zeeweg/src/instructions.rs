use anchor_lang::prelude::*;

use crate::{constants::*, state::*};

#[derive(Accounts)]
#[instruction(marker: MarkerData)]
pub struct AddMarker<'info> {
    #[account(mut)]
    pub author: Signer<'info>,

    #[account(
        init,
        payer = author,
        space = crate::marker_account_space!(marker),
        seeds = [b"marker", marker.position.lat.to_le_bytes().as_ref(), marker.position.lon.to_le_bytes().as_ref()],
        bump
    )]
    pub marker_account: Account<'info, MarkerAccount>,

    #[account(
        init_if_needed, // Using init_if_needed to avoid explicit init for chunks globaly, there’s no re-initialization risk
        payer = author,
        space = crate::marker_chunk_space!(MAX_MARKERS_IN_CHUNK),
        seeds = [b"chunk", marker.position.tile(TILE_RESOLUTION).x.to_le_bytes().as_ref(), marker.position.tile(TILE_RESOLUTION).y.to_le_bytes().as_ref()],
        bump
    )]
    pub marker_chunk: Account<'info, MarkerChunk>,

    pub system_program: Program<'info, System>,
}

pub fn add_marker(ctx: Context<AddMarker>, marker: MarkerData) -> Result<()> {
    let marker_account = &mut ctx.accounts.marker_account;
    let chunk = &mut ctx.accounts.marker_chunk;
    let now = Clock::get()?.unix_timestamp;
    let tile = marker.position.tile(TILE_RESOLUTION);

    // Write marker data
    marker_account.author = ctx.accounts.author.key();
    marker_account.marker = marker;
    marker_account.created_at = now;
    marker_account.updated_at = now;

    // Update chunk
    let marker_key = ctx.accounts.marker_account.key();
    if !chunk.markers.contains(&marker_key) {
        chunk.markers.push(marker_key);
    }

    // Store tile info in chunk if first init
    if chunk.markers.len() == 1 {
        chunk.tile = tile;
    }

    Ok(())
}
