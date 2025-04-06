use anchor_lang::prelude::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("DsUkNGcudGLMf7jMaqsuVcZfX3BDeLoQqnuCVTFrCXyh");

use instructions::*;

#[program]
pub mod zeeweg {
    use super::*;

    pub fn add_marker(ctx: Context<AddMarker>, marker: state::MarkerData) -> Result<()> {
        instructions::add_marker(ctx, marker)
    }
}
