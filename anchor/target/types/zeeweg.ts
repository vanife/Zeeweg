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
          "name": "markerAccount",
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
                  114
                ]
              },
              {
                "kind": "arg",
                "path": "marker.position"
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
      "name": "markerAccount",
      "discriminator": [
        166,
        174,
        96,
        127,
        19,
        33,
        107,
        222
      ]
    }
  ],
  "types": [
    {
      "name": "markerAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "author",
            "type": "pubkey"
          },
          {
            "name": "data",
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
    }
  ]
};
