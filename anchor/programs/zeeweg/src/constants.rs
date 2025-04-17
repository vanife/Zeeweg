/// Maximum number of markers a single tile can store without realloc.
/// Computed as: floor((10_240 - 8 (discriminator) - 8 (Tile) - 4 (vec len)) / 32)
pub const MAX_MARKERS_IN_TILE: usize = 319;

/// Maximum number of markers a single author can store without realloc.
/// Computed as: floor((10_240 - 8 (discriminator) - 32 (author pubkey) - 4 (vec len)) / 32)
pub const MAX_MARKERS_PER_AUTHOR: usize = 310;

/// Size of a tile in microdegrees (° × 1e6).
/// Each tile covers 0.1° × 0.1° of geodetic space.
pub const TILE_RESOLUTION: i32 = 100_000;
