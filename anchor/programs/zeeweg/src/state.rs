use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub struct Position {
    // Microdegrees, degrees * 1e6
    pub lat: i32,
    // Microdegrees, degrees * 1e6
    pub lon: i32,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum MarkerType {
    Basic,
    Park,
    Beach,
    MountainPeak,
    Historical,
    Restaurant,
    Hotel,
    Hospital,
    Hazard,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub struct MarkerData {
    pub title: String,
    pub description: String,
    pub position: Position,
    pub marker_type: MarkerType,
}

#[account]
pub struct MarkerAccount {
    pub author: Pubkey,
    pub data: MarkerData,
    pub created_at: i64,
    pub updated_at: i64,
}

#[macro_export]
macro_rules! marker_space {
    ($marker:expr) => {
        // From https://book.anchor-lang.com/anchor_references/space.html
        8 +                                                                         // Discriminator
        4 + $marker.title.len() +                                                   // title : String prefix + content
        4 + $marker.description.len() +                                             // description: String prefix + content
        std::mem::size_of::<Position>() +                                           // position: Position
        std::mem::size_of::<MarkerType>() +                                         // marker_type: MarkerType
        32 +                                                                        // author: Pubkey
        8 +                                                                         // created_at: i64
        8                                                                           // updated_at: i64
    };
}

impl Position {
    pub fn seed(&self) -> [u8; 8] {
        let mut seed = [0u8; 8];
        seed[..4].copy_from_slice(&self.lat.to_le_bytes());
        seed[4..].copy_from_slice(&self.lon.to_le_bytes());
        seed
    }
}
