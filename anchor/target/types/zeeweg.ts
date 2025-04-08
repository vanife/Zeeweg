/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/zeeweg.json`.
 */
export type Zeeweg = {
  "address": "DsUkNGcudGLMf7jMaqsuVcZfX3BDeLoQqnuCVTFrCXyh",
  "metadata": {
    "name": "zeeweg",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "addMarker",
      "discriminator": [
        55,
        90,
        160,
        157,
        0,
        80,
        79,
        241
      ],
      "accounts": [
        {
          "name": "author",
          "writable": true,
          "signer": true
        },
        {
          "name": "markerEntry",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  114,
                  95,
                  101,
                  110,
                  116,
                  114,
                  121
                ]
              },
              {
                "kind": "arg",
                "path": "marker.position.lat"
              },
              {
                "kind": "arg",
                "path": "marker.position.lon"
              }
            ]
          }
        },
        {
          "name": "markerTile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  109,
                  97,
                  114,
                  107,
                  101,
                  114,
                  95,
                  116,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "arg",
                "path": "marker.position.tile(TILE_RESOLUTION).x"
              },
              {
                "kind": "arg",
                "path": "marker.position.tile(TILE_RESOLUTION).y"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "marker",
          "type": {
            "defined": {
              "name": "markerData"
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "markerEntry",
      "discriminator": [
        155,
        135,
        137,
        236,
        114,
        198,
        64,
        152
      ]
    },
    {
      "name": "markerTile",
      "discriminator": [
        21,
        246,
        172,
        206,
        96,
        252,
        156,
        193
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "chunkFull",
      "msg": "This tile chunk is full"
    }
  ],
  "types": [
    {
      "name": "markerData",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "title",
            "type": "string"
          },
          {
            "name": "description",
            "type": "string"
          },
          {
            "name": "position",
            "type": {
              "defined": {
                "name": "position"
              }
            }
          },
          {
            "name": "markerType",
            "type": {
              "defined": {
                "name": "markerType"
              }
            }
          }
        ]
      }
    },
    {
      "name": "markerEntry",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "marker",
            "type": {
              "defined": {
                "name": "markerData"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "i64"
          },
          {
            "name": "updatedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "markerTile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "tile",
            "type": {
              "defined": {
                "name": "tile"
              }
            }
          },
          {
            "name": "markers",
            "type": {
              "vec": "pubkey"
            }
          }
        ]
      }
    },
    {
      "name": "markerType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "basic"
          },
          {
            "name": "park"
          },
          {
            "name": "beach"
          },
          {
            "name": "mountainPeak"
          },
          {
            "name": "historical"
          },
          {
            "name": "restaurant"
          },
          {
            "name": "hotel"
          },
          {
            "name": "hospital"
          },
          {
            "name": "hazard"
          }
        ]
      }
    },
    {
      "name": "position",
      "docs": [
        "Position represents a geographical point in WGS84 coordinate system",
        "on the map using latitude and longitude in microdegrees ( degrees * 1e6)."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "lat",
            "type": "i32"
          },
          {
            "name": "lon",
            "type": "i32"
          }
        ]
      }
    },
    {
      "name": "tile",
      "docs": [
        "Each tile represents a fixed-size square region on the map,",
        "defined by a resolution in microdegrees (e.g. 100_000 = 0.1°).",
        "",
        "For example, given:",
        "lat = 43160889 (43.160889°)",
        "lon = -2934364 (-2.934364°)",
        "and resolution = 100_000,",
        "the resulting tile will be:",
        "x = 43160889 / 100_000 = 431",
        "y = -2934364 / 100_000 = -29",
        "",
        "This allows grouping markers spatially for fast region queries."
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "x",
            "type": "i32"
          },
          {
            "name": "y",
            "type": "i32"
          }
        ]
      }
    }
  ]
};
