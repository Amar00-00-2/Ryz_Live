module.exports = {
    "name": "nsefo",
    "fields": [
      {
        "name": "ExchangeSegment",
        "type": "string",
        "facet": false
      },
      {
        "name": "ExchangeInstrumentID",
        "type": "string",
        "facet": false
      },
      {
        "name": "InstrumentType",
        "type": "string",
        "facet": true
      },
      {
        "name": "Name",
        "type": "string",
        "facet": true,
        "infix": true
      },
      {
        "name": "Description",
        "type": "string",
        "facet": true
      },
      {
        "name": "Month",
        "type": "string",
        "facet": true,
        "infix": true
      },
      {
        "name": "Series",
        "type": "string",
        "facet": false,
        "sort": true
      },
      {
        "name": "Series_Key",
        "type": "string",
        "facet": false
      },
      {
        "name": "NameWithSeries",
        "type": "string",
        "facet": false
      },
      {
        "name": "InstrumentID",
        "type": "string",
        "facet": true
      },
      {
        "name": "PriceBandHigh",
        "type": "string",
        "facet": false
      },
      {
        "name": "PriceBandLow",
        "type": "string",
        "facet": true
      },
      {
        "name": "FreezeQty",
        "type": "string",
        "facet": false
      },
      {
        "name": "TickSize",
        "type": "string",
        "facet": true
      },
      {
        "name": "LotSize",
        "type": "string",
        "facet": false
      },
      {
        "name": "Multiplier",
        "type": "string",
        "facet": true
      },
      {
        "name": "UnderlyingInstrumentId",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "UnderlyingIndexName",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "ContractExpiration",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "StrikePrice",
        "type": "float",
        // "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "OptionType",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "DisplayName",
        "type": "string",
        "facet": true,
        "optional": true
      },
      {
        "name": "CompanyName",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "ContractExpirationString",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "ISIN",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "PriceNumerator",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "PriceDenominotor",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "FullName",
        "type": "string",
        "facet": false,
        "optional": true
      },
      {
        "name": "DayType",
        "type": "string",
        "facet": false
      },
      {
        "name": "OptionTypeString",
        "type": "string",
        "facet": true,
        "infix": true
      },
      {
        "name": "StrikePriceString",
        "type": "string",
        "facet": true,
        "infix": true
      }
    ],
    "token_separators": ["."]
}
  